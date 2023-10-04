import { WALLET_ID } from 'src/constants'
import { compareAccounts } from 'src/utils'
import { StoreActions, type State } from 'src/types/state'
import type { WalletClient } from 'src/clients'
import type { WalletAccount, WalletConstructor } from 'src/types/wallet'
import type { Store } from 'src/store'

export class Wallet {
  private _id: WALLET_ID
  private client: WalletClient
  private store: Store<State>
  private notifySubscribers: () => void
  public subscribe: (callback: (state: State) => void) => () => void

  constructor({ id, client, store, subscribe, onStateChange }: WalletConstructor) {
    this._id = id
    this.client = client
    this.store = store
    this.subscribe = subscribe
    this.notifySubscribers = onStateChange
  }

  // ---------- Wallet ------------------------------------------------ //

  public get id() {
    return this._id
  }

  public get isConnected(): boolean {
    const state = this.store.getState()
    const walletState = state.wallets.get(this.id)
    return walletState ? walletState.accounts.length > 0 : false
  }

  public get isActive(): boolean {
    const state = this.store.getState()
    return state.activeWallet === this.id
  }

  public setActive = (): void => {
    console.info(`[Wallet] Setting active wallet: ${this.id}`)
    this.store.dispatch(StoreActions.SET_ACTIVE_WALLET, this.id)

    this.notifySubscribers()
  }

  // ---------- Accounts ---------------------------------------------- //

  public get accounts() {
    const state = this.store.getState()
    const walletState = state.wallets.get(this.id)
    return walletState ? walletState.accounts : []
  }

  public get activeAccount() {
    const state = this.store.getState()
    const walletState = state.wallets.get(this.id)
    return walletState ? walletState.activeAccount : null
  }

  public setActiveAccount = (account: string): void => {
    console.info(`[Wallet] Setting active account: ${account}`)
    this.store.dispatch(StoreActions.SET_ACTIVE_ACCOUNT, {
      walletId: this.id,
      address: account
    })

    this.notifySubscribers()
  }

  // ---------- Connection Methods ------------------------------------ //

  public connect = async (): Promise<WalletAccount[]> => {
    console.info(`[Wallet] Connecting wallet: ${this.id}`)
    const accounts = await this.client.connect(() => this.handleDisconnect())

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found!')
    }
    const activeAccount: WalletAccount | null = accounts.length > 0 ? accounts?.[0] || null : null

    if (activeAccount) {
      this.store.dispatch(StoreActions.ADD_WALLET, {
        walletId: this.id,
        wallet: {
          accounts,
          activeAccount
        }
      })

      this.notifySubscribers()
    }

    return accounts
  }

  public resumeSession = async (): Promise<void> => {
    const state = this.store.getState()
    const walletState = state.wallets.get(this.id)

    if (!walletState) {
      // Disconnected wallet, do nothing
      return
    }
    console.info(`[Wallet] Resuming connected wallet session: ${this.id}`)
    const accounts = await this.client.resumeSession(() => this.handleDisconnect())

    if (typeof accounts === 'undefined') {
      // Client returned void, do nothing
      return
    } else if (accounts.length === 0) {
      // Error or no accounts found
      this.handleDisconnect()
      return
    } else {
      // Accounts found, compare to state
      const doAccountsMatch = compareAccounts(accounts, walletState.accounts)

      if (!doAccountsMatch) {
        // Accounts mismatch, set to latest accounts
        console.warn(`[Wallet] Accounts mismatch in ${this.id}, updating accounts`)
        this.store.dispatch(StoreActions.SET_ACCOUNTS, {
          walletId: this.id,
          accounts
        })

        this.notifySubscribers()
      }
    }
  }

  public disconnect = async (): Promise<void> => {
    console.info(`[Wallet] Disconnecting wallet: ${this.id}`)
    await this.client.disconnect()
    this.handleDisconnect()
  }

  // ---------- Private ----------------------------------------------- //

  private handleDisconnect = (): void => {
    console.info(`[Wallet] Handle disconnecting wallet: ${this.id}`)
    this.store.dispatch(StoreActions.REMOVE_WALLET, this.id)

    this.notifySubscribers()
  }
}
