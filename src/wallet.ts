import { WalletClient } from './clients'
import { WALLET_ID } from './constants'
import { WalletManager } from './manager'
import { deleteWalletState, loadWalletState, saveWalletState } from './utils/state'
import type { WalletAccount, WalletConstructor } from './types/wallet'

export class Wallet {
  private _id: WALLET_ID
  private client: WalletClient
  private manager: WalletManager
  private _accounts: WalletAccount[] = []
  private _activeAccount: WalletAccount | null = null

  constructor({ id, client, manager }: WalletConstructor) {
    this._id = id
    this.client = client
    this.manager = manager
    this.loadFromLocalStorage()
  }

  // ---------- Wallet ------------------------------------------------ //

  public get id() {
    return this._id
  }

  public get isConnected(): boolean {
    return this.accounts.length > 0
  }

  public get isActive(): boolean {
    return this.manager.activeWallet?.id === this.id
  }

  public setActive = (): void => {
    console.info(`[Wallet] Setting active wallet: ${this.id}`)
    this.manager.setActiveWallet(this.id)
  }

  // ---------- Accounts ---------------------------------------------- //

  public get accounts() {
    return this._accounts
  }

  public get activeAccount() {
    return this._activeAccount
  }

  public setActiveAccount = (account: string): void => {
    console.info(`[Wallet] Setting active account: ${account}`)
    const activeAccount = this.accounts.find((a) => a.address === account)
    this.activeAccount = activeAccount || null
    this.saveToLocalStorage()
  }

  // ---------- Connection Methods ------------------------------------ //

  public connect = async (): Promise<WalletAccount[]> => {
    console.info(`[Wallet] Connecting wallet: ${this.id}`)
    const accounts = await this.client.connect(() => this.handleDisconnect())

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found!')
    }
    this.accounts = accounts
    const activeAccount: WalletAccount | null = accounts.length > 0 ? accounts?.[0] || null : null

    if (activeAccount) {
      this.activeAccount = activeAccount
    }

    this.manager.setActiveWallet(this.id)

    this.saveToLocalStorage()
    return accounts
  }

  public reconnect = async (): Promise<void> => {
    console.info(`[Wallet] Reconnecting wallet: ${this.id}`)
    const accounts = await this.client.reconnect(() => this.handleDisconnect())

    if (Array.isArray(accounts)) {
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found!')
      }
      this.accounts = accounts
      const activeAccount: WalletAccount | null = accounts.length > 0 ? accounts?.[0] || null : null

      if (activeAccount) {
        this.activeAccount = activeAccount
      }

      this.saveToLocalStorage()
    }
  }

  public disconnect = async (): Promise<void> => {
    console.info(`[Wallet] Disconnecting wallet: ${this.id}`)
    await this.client.disconnect()
    this.handleDisconnect()
  }

  // ---------- Private ----------------------------------------------- //

  private set accounts(accounts: WalletAccount[]) {
    this._accounts = accounts
  }

  private set activeAccount(account: WalletAccount | null) {
    this._activeAccount = account
  }

  private handleDisconnect = (): void => {
    console.info(`[Wallet] Handle disconnecting wallet: ${this.id}`)
    this.accounts = []
    this.activeAccount = null
    this.saveToLocalStorage()
  }

  // ---------- Local Storage ----------------------------------------- //

  private loadFromLocalStorage(): void {
    console.info(`[Wallet] Loading wallet state: ${this.id}`)
    const state = loadWalletState(this.id)
    if (state) {
      console.info(`[Wallet] Loaded wallet state`, state)
      this.accounts = state.accounts
      this.activeAccount = state.activeAccount
    }
  }

  private saveToLocalStorage(): void {
    console.info(`[Wallet] Saving wallet state: ${this.id}`)
    if (this.accounts.length === 0) {
      return deleteWalletState(this.id)
    } else {
      saveWalletState(this.id, {
        accounts: this.accounts,
        activeAccount: this.activeAccount || this.accounts[0] || null
      })
    }
  }
}
