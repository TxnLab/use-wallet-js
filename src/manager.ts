import { clients, BaseClient } from './wallets'
import { LOCAL_STORAGE_KEY } from './constants'
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
  private wallets: Record<string, BaseClient | null> = {}
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

      if (walletClient) {
        // Set persisted accounts for wallet client
        const accounts: Account[] = this.accounts
          .filter((account) => account.walletId === walletId)
          .map((account) => ({
            name: account.name,
            address: account.address
          }))

        if (accounts.length > 0) {
          walletClient.accounts = accounts
        }
      } else {
        console.error(`Failed to initialize client for wallet ID: ${walletId}`)
        continue // Skip to next client
      }

      this.wallets[walletId] = walletClient
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

  // public async connect(id: WALLET_ID): Promise<Account[]> {
  //   // @todo: call active wallet client's `connect` method
  // }

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
