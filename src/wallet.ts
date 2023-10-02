import { WalletClient } from './clients'
import { WALLET_ID } from './constants'
import { WalletManager } from './manager'
import { StoreActions, type State } from './types/state'
import type { WalletAccount, WalletConstructor } from './types/wallet'
import type { Store } from './store'

export class Wallet {
  private _id: WALLET_ID
  private client: WalletClient
  private manager: WalletManager
  private store: Store<State>

  constructor({ id, client, manager, store }: WalletConstructor) {
    this._id = id
    this.client = client
    this.manager = manager
    this.store = store
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
    this.manager.setActiveWallet(this.id)
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
    }

    return accounts
  }

  // @todo: add action that compares provided accounts with existing ones
  // @todo: add action that compares provided active account with existing one
  public reconnect = async (): Promise<void> => {
    console.info(`[Wallet] Reconnecting wallet: ${this.id}`)
    const accounts = await this.client.reconnect(() => this.handleDisconnect())

    if (Array.isArray(accounts)) {
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found!')
      }
      // this.accounts = accounts
      const activeAccount: WalletAccount | null = accounts.length > 0 ? accounts?.[0] || null : null

      if (activeAccount) {
        // this.activeAccount = activeAccount
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
  }
}
