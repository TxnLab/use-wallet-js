import { clients, BaseClient } from './clients'
import { LOCAL_STORAGE_KEY, WALLET_ID } from './constants'
import { processNewAccounts } from './utils/manager'
import type {
  InitializeConfig,
  WalletAccount,
  PersistedState,
  Account,
  WalletConfig,
  WalletConfigMap,
  WalletManagerConfig
} from './types/wallet'

export class WalletManager {
  private clients: Record<string, BaseClient | null> = {}
  private accounts: WalletAccount[] = []
  private activeAccount: WalletAccount | null = null

  constructor({ wallets }: WalletManagerConfig) {
    this.loadFromLocalStorage()
    this.initialize(wallets)
  }

  private initialize<T extends keyof WalletConfigMap>(wallets: Array<T | WalletConfig<T>>) {
    for (const wallet of wallets) {
      let walletId: T
      let walletConfig: InitializeConfig<T> | undefined

      if (typeof wallet === 'string') {
        walletId = wallet
      } else {
        const { id, ...config } = wallet
        walletId = id
        walletConfig = config as InitializeConfig<T>
      }

      const ClientClass = clients[walletId]
      if (!ClientClass) {
        console.error(`No client found for wallet ID: ${walletId}`)
        continue // Skip to next client
      }

      // Initialize wallet client
      const walletClient: BaseClient | null = ClientClass.initialize(walletConfig)

      if (!walletClient) {
        console.error(`Failed to initialize client for wallet ID: ${walletId}`)
        continue // Skip to next client
      }

      this.clients[walletId] = walletClient

      // Initialize wallet
    }
  }

  private loadFromLocalStorage(): void {
    const savedState = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (savedState) {
      const parsedState: PersistedState = JSON.parse(savedState)
      this.accounts = parsedState.accounts
      this.activeAccount = parsedState.activeAccount
    }
  }

  private saveToLocalStorage(): void {
    const state: PersistedState = {
      accounts: this.accounts,
      activeAccount: this.activeAccount
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state))
  }

  private getActiveWalletClient(): BaseClient | null {
    if (!this.activeAccount) {
      console.error('No active account set.')
      return null
    }
    const walletId = this.activeAccount.walletId
    const activeWallet = this.clients[walletId]
    if (!activeWallet) {
      console.error(`No wallet found for wallet ID: ${walletId}`)
      return null
    }
    return activeWallet
  }

  private handleDisconnect(id: WALLET_ID): void {
    if (this.activeAccount && this.activeAccount.walletId === id) {
      this.activeAccount = null
    }

    this.accounts = this.accounts.filter((account) => account.walletId !== id)
    this.saveToLocalStorage()
  }

  public get activeWalletClient(): BaseClient | null {
    return this.getActiveWalletClient()
  }

  public async connect(id: WALLET_ID): Promise<Account[]> {
    const client = this.clients[id]
    if (!client) {
      throw new Error(`No client found for wallet ID: ${id}`)
    }
    const newAccounts = await client.connect(() => this.handleDisconnect(id))

    if (!newAccounts || newAccounts.length === 0) {
      throw new Error('No accounts found!')
    }
    const { accounts, activeAccount } = processNewAccounts(id, newAccounts, this.accounts)

    this.accounts = accounts
    this.activeAccount = activeAccount
    this.saveToLocalStorage()

    return newAccounts.map<Account>((account) => ({
      name: account.name,
      address: account.address
    }))
  }

  public async reconnect(id: WALLET_ID): Promise<void> {
    const client = this.clients[id]
    if (!client) {
      throw new Error(`No client found for wallet ID: ${id}`)
    }
    const newAccounts = await client.reconnect(() => this.handleDisconnect(id))

    // Only update state if wallet client's `reconnect` method returns an array
    if (Array.isArray(newAccounts)) {
      if (newAccounts.length === 0) {
        throw new Error('No accounts found!')
      }
      const { accounts } = processNewAccounts(id, newAccounts, this.accounts)

      this.accounts = accounts
      this.saveToLocalStorage()
    }
  }

  public async disconnect(id: WALLET_ID): Promise<void> {
    const client = this.clients[id]
    if (!client) {
      console.error(`No client found for wallet ID: ${id}`)
      return
    }
    await client.disconnect()
  }

  // public async transactionSigner(
  //   txnGroup: Transaction[],
  //   indexesToSign: number[]
  // ): Promise<Uint8Array[]>

  // public async transactionSigner(
  //   txnGroup: Uint8Array[] | Uint8Array[][],
  //   indexesToSign?: number[],
  //   returnGroup?: boolean
  // ): Promise<Uint8Array[]>

  // public async transactionSigner(
  //   txnGroup: Transaction[] | Uint8Array[] | Uint8Array[][],
  //   indexesToSign?: number[],
  //   returnGroup = true
  // ): Promise<Uint8Array[]> {
  //   // @todo: call active wallet client's `transactionSigner` method
  // }
}
