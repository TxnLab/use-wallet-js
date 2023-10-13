import algosdk from 'algosdk'
import { defaultNetworkConfigMap, NetworkId, WALLET_ID } from 'src/constants'
import { allWallets, BaseWallet } from 'src/wallets'
import { Network } from 'src/network'
import { createStore, defaultState, Store } from 'src/store'
import { deepMerge, isNetworkConfigMap } from 'src/utils'
import { StoreActions, type State } from 'src/types/state'
import type { TransactionSigner } from 'algosdk'
import type { NetworkConfig, NetworkConfigMap } from 'src/types/network'
import type { TransactionSignerAccount } from './types/transaction'
import type {
  WalletAccount,
  WalletIdConfig,
  WalletConfigMap,
  WalletManagerConstructor,
  WalletOptions,
  WalletMetadata
} from 'src/types/wallet'

export class WalletManager {
  private _wallets: Map<WALLET_ID, BaseWallet> = new Map()
  private network: Network
  private store: Store<State>
  private subscribers: Array<(state: State) => void> = []

  constructor({ wallets, network = NetworkId.TESTNET, algod = {} }: WalletManagerConstructor) {
    this.store = createStore({
      ...defaultState,
      activeNetwork: network
    })
    this.network = this.initializeNetwork(network, algod)
    this.initializeWallets(wallets)
  }

  // ---------- Subscription ------------------------------------------ //

  public subscribe = (callback: (state: State) => void): (() => void) => {
    this.subscribers.push(callback)
    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== callback)
    }
  }

  private notifySubscribers = (): void => {
    const state = this.store.getState()
    this.subscribers.forEach((sub) => sub(state))
  }

  // ---------- Wallets ----------------------------------------------- //

  private initializeWallets = <T extends keyof WalletConfigMap>(
    walletsConfig: Array<T | WalletIdConfig<T>>
  ) => {
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
      const WalletClass = allWallets[walletId]
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
        subscribe: this.subscribe,
        onStateChange: this.notifySubscribers
      })

      this._wallets.set(walletId, walletInstance)
      console.info(`[Manager] ✅ Initialized ${walletId}`)
    }

    const state = this.store.getState()

    // Check if connected wallets are still valid
    const connectedWallets = state.wallets.keys()
    for (const walletId of connectedWallets) {
      if (!this._wallets.has(walletId)) {
        console.warn(`[Manager] Connected wallet not found: ${walletId}`)
        this.store.dispatch(StoreActions.REMOVE_WALLET, { walletId })

        this.notifySubscribers()
      }
    }

    // Check if active wallet is still valid
    if (state.activeWallet && !this._wallets.has(state.activeWallet)) {
      console.warn(`[Manager] Active wallet not found: ${state.activeWallet}`)
      this.store.dispatch(StoreActions.SET_ACTIVE_WALLET, { walletId: null })

      this.notifySubscribers()
    }
  }

  public get wallets(): BaseWallet[] {
    return [...this._wallets.values()]
  }

  public resumeSessions = async (): Promise<void> => {
    const promises = this.wallets.map((wallet) => wallet?.resumeSession())
    await Promise.all(promises)
  }

  // ---------- Network ----------------------------------------------- //

  private initializeNetwork = (network: NetworkId, config: NetworkConfig): Network => {
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

    return new Network({
      config: networkConfig,
      store: this.store,
      subscribe: this.subscribe,
      onStateChange: this.notifySubscribers
    })
  }

  public setActiveNetwork = (network: NetworkId): void => {
    this.network.setActiveNetwork(network)
  }

  public get activeNetwork(): NetworkId {
    return this.network.activeNetwork
  }

  public get algodClient(): algosdk.Algodv2 {
    return this.network.algodClient
  }

  public get blockExplorer(): string {
    return this.network.blockExplorer
  }

  public get chainId(): string | undefined {
    return this.network.chainId
  }

  // ---------- Active Wallet ----------------------------------------- //

  public get activeWallet(): BaseWallet | null {
    const state = this.store.getState()
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
  public get transactionSigner(): TransactionSigner {
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
