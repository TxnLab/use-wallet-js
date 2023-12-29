import { Store } from '@tanstack/store'
import algosdk from 'algosdk'
import {
  defaultNetworkConfigMap,
  isNetworkConfigMap,
  NetworkId,
  blockExplorer,
  type NetworkConfig,
  type NetworkConfigMap,
  AlgodConfig,
  caipChainId
} from 'src/network'
import {
  defaultState,
  removeWallet,
  setActiveNetwork,
  setActiveWallet,
  type State
} from 'src/store'
import { LOCAL_STORAGE_KEY } from 'src/store/constants'
import { isValidState, replacer, reviver } from 'src/store/utils'
import { BaseWallet } from './base'
import { WalletId, walletMap } from './supported'
import { deepMerge } from './utils'
import type {
  SupportedWallets,
  TransactionSignerAccount,
  WalletAccount,
  WalletConfigMap,
  WalletIdConfig,
  WalletMetadata,
  WalletOptions
} from './types'

export interface WalletManagerConfig {
  wallets: SupportedWallets
  network?: NetworkId
  algod?: NetworkConfig
}

export class WalletManager {
  private _wallets: Map<WalletId, BaseWallet> = new Map()

  private networkConfig: NetworkConfigMap
  public algodClient: algosdk.Algodv2

  public store: Store<State>
  public subscribe: (callback: (state: State) => void) => () => void

  constructor({ wallets, network = NetworkId.TESTNET, algod = {} }: WalletManagerConfig) {
    const initialState = this.loadPersistedState() || {
      ...defaultState,
      activeNetwork: network
    }

    this.store = new Store<State>(initialState, {
      onUpdate: () => this.savePersistedState()
    })

    this.savePersistedState()

    this.subscribe = (callback: (state: State) => void): (() => void) => {
      const unsubscribe = this.store.subscribe(() => {
        callback(this.store.state)
      })

      return unsubscribe
    }

    this.networkConfig = this.initNetworkConfig(network, algod)
    this.algodClient = this.createAlgodClient(this.networkConfig[network])

    this.initializeWallets(wallets)
  }

  // ---------- Store ------------------------------------------------- //

  private loadPersistedState(): State | null {
    try {
      const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (serializedState === null) {
        return null
      }
      const parsedState = JSON.parse(serializedState, reviver)
      if (!isValidState(parsedState)) {
        console.warn('[Store] Parsed state:', parsedState)
        throw new Error('Persisted state is invalid')
      }
      return parsedState as State
    } catch (error: any) {
      console.error(`[Store] Could not load state from local storage: ${error.message}`)
      return null
    }
  }

  private savePersistedState(): void {
    try {
      const state = this.store.state
      const serializedState = JSON.stringify(state, replacer)
      localStorage.setItem(LOCAL_STORAGE_KEY, serializedState)
    } catch (error) {
      console.error('[Store] Could not save state to local storage:', error)
    }
  }

  // ---------- Wallets ----------------------------------------------- //

  private initializeWallets<T extends keyof WalletConfigMap>(
    walletsConfig: Array<T | WalletIdConfig<T>>
  ) {
    console.info('[Manager] Initializing wallets...')

    for (const walletConfig of walletsConfig) {
      let walletId: T
      let walletOptions: WalletOptions<T> | undefined
      let walletMetadata: Partial<WalletMetadata> | undefined

      // Parse wallet config
      if (typeof walletConfig === 'string') {
        walletId = walletConfig
      } else {
        const { id, options, metadata } = walletConfig
        walletId = id
        walletOptions = options
        walletMetadata = metadata
      }

      // Get wallet class
      const WalletClass = walletMap[walletId]
      if (!WalletClass) {
        console.error(`[Manager] Wallet not found: ${walletId}`)
        continue
      }

      // Initialize wallet
      const walletInstance = new WalletClass({
        id: walletId,
        metadata: walletMetadata,
        store: this.store,
        options: walletOptions as any,
        subscribe: this.subscribe
      })

      this._wallets.set(walletId, walletInstance)
      console.info(`[Manager] ✅ Initialized ${walletId}`)
    }

    const state = this.store.state

    // Check if connected wallets are still valid
    const connectedWallets = state.wallets.keys()
    for (const walletId of connectedWallets) {
      if (!this._wallets.has(walletId)) {
        console.warn(`[Manager] Connected wallet not found: ${walletId}`)
        removeWallet(this.store, { walletId })
      }
    }

    // Check if active wallet is still valid
    if (state.activeWallet && !this._wallets.has(state.activeWallet)) {
      console.warn(`[Manager] Active wallet not found: ${state.activeWallet}`)
      setActiveWallet(this.store, { walletId: null })
    }
  }

  public get wallets(): BaseWallet[] {
    return [...this._wallets.values()]
  }

  public getWallet(walletId: WalletId): BaseWallet | undefined {
    return this._wallets.get(walletId)
  }

  public async resumeSessions(): Promise<void> {
    const promises = this.wallets.map((wallet) => wallet?.resumeSession())
    await Promise.all(promises)
  }

  // ---------- Network ----------------------------------------------- //

  private initNetworkConfig(network: NetworkId, config: NetworkConfig): NetworkConfigMap {
    console.info('[Manager] Initializing network...')

    let networkConfig: NetworkConfigMap = defaultNetworkConfigMap

    if (isNetworkConfigMap(config)) {
      // Config for multiple networks
      networkConfig = deepMerge(networkConfig, config)
    } else {
      // Config for single (active) network
      networkConfig[network] = deepMerge(networkConfig[network], config)
    }

    console.info('[Manager] Algodv2 config:', networkConfig)

    return networkConfig
  }

  private createAlgodClient(config: AlgodConfig): algosdk.Algodv2 {
    console.info(`[Manager] Creating Algodv2 client for ${this.activeNetwork}...`)
    const { token = '', baseServer, port = '', headers = {} } = config
    return new algosdk.Algodv2(token, baseServer, port, headers)
  }

  public setActiveNetwork(networkId: NetworkId): void {
    setActiveNetwork(this.store, { networkId })
    this.algodClient = this.createAlgodClient(this.networkConfig[networkId])
  }

  public get activeNetwork(): NetworkId {
    return this.store.state.activeNetwork
  }

  public get blockExplorer(): string {
    return blockExplorer[this.activeNetwork]
  }

  public get chainId(): string | undefined {
    return caipChainId[this.activeNetwork]
  }

  // ---------- Active Wallet ----------------------------------------- //

  public get activeWallet(): BaseWallet | null {
    const state = this.store.state
    const activeWallet = this.wallets.find((wallet) => wallet.id === state.activeWallet)
    if (!activeWallet) {
      return null
    }

    return activeWallet
  }

  public get activeWalletAccounts(): WalletAccount[] | null {
    if (!this.activeWallet) {
      return null
    }
    return this.activeWallet.accounts
  }

  public get activeWalletAddresses(): string[] | null {
    if (!this.activeWallet) {
      return null
    }
    return this.activeWallet.accounts.map((account) => account.address)
  }

  public get activeAccount(): WalletAccount | null {
    if (!this.activeWallet) {
      return null
    }
    return this.activeWallet.activeAccount
  }

  public get activeAddress(): string | null {
    if (!this.activeAccount) {
      return null
    }
    return this.activeAccount.address
  }

  // ---------- Sign Transactions ------------------------------------- //

  public get signTransactions() {
    if (!this.activeWallet) {
      throw new Error('[Manager] No active wallet found!')
    }
    return this.activeWallet.signTransactions
  }

  /**
   * A function which can sign transactions from an atomic transaction group. The logic will be
   * specific to each wallet, but the function will always return a promise that resolves to an
   * array of encoded signed transactions matching the length of the indexesToSign array.
   *
   * @see https://github.com/algorand/js-algorand-sdk/blob/v2.6.0/src/signer.ts#L7-L18
   *
   * @param txnGroup - The atomic group containing transactions to be signed
   * @param indexesToSign - An array of indexes in the atomic transaction group that should be signed
   * @returns A promise which resolves an array of encoded signed transactions. The length of the
   *   array will be the same as the length of indexesToSign, and each index i in the array
   *   corresponds to the signed transaction from txnGroup[indexesToSign[i]]
   */
  public get transactionSigner(): algosdk.TransactionSigner {
    if (!this.activeWallet) {
      throw new Error('[Manager] No active wallet found!')
    }
    return this.activeWallet.transactionSigner
  }

  /**
   * A wrapper around `TransactionSigner` that also has the sender address (the current active
   * account). Can be used to produce a `TransactionWithSigner` object ready to be passed to an
   * AtomicTransactionComposer's `addTransaction` method.
   *
   * @see https://github.com/algorandfoundation/algokit-utils-ts/blob/v4.0.0/docs/code/modules/index.md#gettransactionwithsigner
   */
  public get transactionSignerAccount(): TransactionSignerAccount {
    if (!this.activeAddress) {
      throw new Error('[Manager] No active account found!')
    }
    return {
      addr: this.activeAddress,
      signer: this.transactionSigner
    }
  }
}
