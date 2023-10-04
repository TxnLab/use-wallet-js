import { clients, WalletClient } from './clients'
import { createStore, defaultState, Store } from './store'
import { Wallet } from './wallet'
import type { Transaction } from 'algosdk'
import type { State } from './types/state'
import type {
  ClientConfig,
  WalletAccount,
  WalletConfig,
  ClientConfigMap,
  WalletManagerConstructor
} from './types/wallet'

export class WalletManager {
  private clients: Record<string, WalletClient | null> = {}
  private store: Store<State>
  private _wallets: Wallet[] = []
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
      let clientConfig: ClientConfig<T> | undefined

      // Parse client config
      if (typeof wallet === 'string') {
        walletId = wallet
      } else {
        const { id, ...config } = wallet
        walletId = id
        clientConfig = config as ClientConfig<T>
      }

      // Get client class
      const ClientClass = clients[walletId]
      if (!ClientClass) {
        console.error(`No client found for wallet ID: ${walletId}`)
        continue
      }

      // Initialize client
      const walletClient: WalletClient | null = ClientClass.initialize(clientConfig)

      if (!walletClient) {
        console.error(`Failed to initialize client for wallet ID: ${walletId}`)
        continue
      }

      this.clients[walletId] = walletClient
      console.info(`[Manager] Initialized client for wallet ID: ${walletId}`, walletClient)

      // Initialize wallet
      const walletInstance = new Wallet({
        id: walletId,
        client: walletClient,
        store: this.store,
        subscribe: this.subscribe,
        onStateChange: this.notifySubscribers
      })

      this.wallets.push(walletInstance)
      console.info(`[Manager] Initialized wallet for wallet ID: ${walletId}`, walletInstance)
    }
    console.info('[Manager] Initialized wallets', this.wallets)
  }

  public get wallets(): Wallet[] {
    return this._wallets
  }

  private set wallets(wallets: Wallet[]) {
    this._wallets = wallets
  }

  public resumeSessions = async (): Promise<void> => {
    const promises = this.wallets.map((wallet) => wallet?.resumeSession())
    await Promise.all(promises)
  }

  // ---------- Active Wallet ----------------------------------------- //

  public get activeWallet(): Wallet | null {
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

    const connectedAccounts = this.activeWallet.accounts.map((account) => account.address)
    const client = this.clients[this.activeWallet.id]

    if (!client) {
      throw new Error('No client found!')
    }

    return client.transactionSigner(connectedAccounts, txnGroup, indexesToSign, returnGroup)
  }
}
