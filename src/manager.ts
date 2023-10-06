import { WALLET_ID } from 'src/constants'
import { allWallets, BaseWallet } from 'src/wallets'
import { createStore, defaultState, Store } from 'src/store'
import { StoreActions, type State } from 'src/types/state'
import type { Transaction } from 'algosdk'
import type {
  WalletAccount,
  WalletConfig,
  ClientConfigMap,
  WalletManagerConstructor,
  ClientOptions
} from 'src/types/wallet'

export class WalletManager {
  private _wallets: Map<WALLET_ID, BaseWallet> = new Map()
  private store: Store<State>
  private subscribers: Array<(state: State) => void> = []

  constructor({ wallets }: WalletManagerConstructor) {
    this.store = createStore(defaultState)
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

  private initializeWallets = <T extends keyof ClientConfigMap>(
    wallets: Array<T | WalletConfig<T>>
  ) => {
    console.info('[Manager] Initializing wallets...')

    for (const wallet of wallets) {
      let walletId: T
      let clientOptions: ClientOptions<T> | undefined

      // Parse client config
      if (typeof wallet === 'string') {
        walletId = wallet
      } else {
        const { id, options } = wallet
        walletId = id
        clientOptions = options
      }

      // Get wallet class
      const WalletClass = allWallets[walletId]
      if (!WalletClass) {
        console.error(`Wallet not found: ${walletId}`)
        continue
      }

      // Initialize wallet
      const walletInstance = new WalletClass({
        id: walletId,
        store: this.store,
        options: clientOptions as any,
        subscribe: this.subscribe,
        onStateChange: this.notifySubscribers
      })

      this._wallets.set(walletId, walletInstance)
      console.info(`[Manager] Initialized wallet for wallet ID: ${walletId}`, walletInstance)
    }
    console.info('[Manager] Initialized wallets', this._wallets)

    const state = this.store.getState()

    // Check if connected wallets are still valid
    const connectedWallets = state.wallets.keys()
    for (const walletId of connectedWallets) {
      if (!this._wallets.has(walletId)) {
        console.warn(`[Manager] Connected wallet not found: ${walletId}`)
        this.store.dispatch(StoreActions.REMOVE_WALLET, walletId)

        this.notifySubscribers()
      }
    }

    // Check if active wallet is still valid
    if (state.activeWallet && !this._wallets.has(state.activeWallet)) {
      console.warn(`[Manager] Active wallet not found: ${state.activeWallet}`)
      this.store.dispatch(StoreActions.SET_ACTIVE_WALLET, null)

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

  // ---------- Transaction Signer ------------------------------------ //

  public async transactionSigner(
    txnGroup: Transaction[],
    indexesToSign: number[]
  ): Promise<Uint8Array[]>

  public async transactionSigner(
    txnGroup: Uint8Array[] | Uint8Array[][],
    indexesToSign?: number[],
    returnGroup?: boolean
  ): Promise<Uint8Array[]>

  public async transactionSigner(
    txnGroup: Transaction[] | Uint8Array[] | Uint8Array[][],
    indexesToSign?: number[],
    returnGroup = true
  ): Promise<Uint8Array[]> {
    if (!this.activeWallet) {
      throw new Error('No active wallet found!')
    }

    const wallet = this._wallets.get(this.activeWallet.id)

    if (!wallet) {
      throw new Error('Wallet not found!')
    }

    const connectedAccounts = wallet.accounts.map((account) => account.address)

    return wallet.transactionSigner(connectedAccounts, txnGroup, indexesToSign, returnGroup)
  }
}
