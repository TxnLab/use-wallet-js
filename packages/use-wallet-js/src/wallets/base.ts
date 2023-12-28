import { Store } from '@tanstack/store'
import algosdk from 'algosdk'
import { NetworkId } from 'src/network'
import { type State, setActiveWallet, setActiveAccount, removeWallet } from 'src/store'
import { WalletId } from './supported'
import type { WalletAccount, WalletConstructor, WalletMetadata } from './types'

interface WalletConstructorType {
  new (...args: any[]): BaseWallet
  defaultMetadata: WalletMetadata
}

export abstract class BaseWallet {
  readonly id: WalletId
  readonly metadata: WalletMetadata

  protected store: Store<State>

  public subscribe: (callback: (state: State) => void) => () => void

  protected constructor({ id, metadata, store, subscribe }: WalletConstructor<WalletId>) {
    this.id = id
    this.store = store
    this.subscribe = subscribe

    const ctor = this.constructor as WalletConstructorType
    this.metadata = { ...ctor.defaultMetadata, ...metadata }
  }

  static defaultMetadata: WalletMetadata = { name: 'Base Wallet', icon: '' }

  // ---------- Public Methods ---------------------------------------- //

  public abstract connect(): Promise<WalletAccount[]>
  public abstract disconnect(): Promise<void>
  public abstract resumeSession(): Promise<void>

  public setActive(): void {
    console.info(`[Wallet] Set active wallet: ${this.id}`)
    setActiveWallet(this.store, { walletId: this.id })
  }

  public setActiveAccount(account: string): void {
    console.info(`[Wallet] Set active account: ${account}`)
    setActiveAccount(this.store, {
      walletId: this.id,
      address: account
    })
  }

  public abstract signTransactions(
    txnGroup: algosdk.Transaction[] | algosdk.Transaction[][] | Uint8Array[] | Uint8Array[][],
    indexesToSign?: number[],
    returnGroup?: boolean
  ): Promise<Uint8Array[]>

  public abstract transactionSigner(
    txnGroup: algosdk.Transaction[],
    indexesToSign: number[]
  ): Promise<Uint8Array[]>

  // ---------- Derived Properties ------------------------------------ //

  public get accounts(): WalletAccount[] {
    const state = this.store.state
    const walletState = state.wallets.get(this.id)
    return walletState ? walletState.accounts : []
  }

  public get addresses(): string[] {
    return this.accounts.map((account) => account.address)
  }

  public get activeAccount(): WalletAccount | null {
    const state = this.store.state
    const walletState = state.wallets.get(this.id)
    return walletState ? walletState.activeAccount : null
  }

  public get activeAddress(): string | null {
    return this.activeAccount?.address ?? null
  }

  public get activeNetwork(): NetworkId {
    const state = this.store.state
    return state.activeNetwork
  }

  public get isConnected(): boolean {
    const state = this.store.state
    const walletState = state.wallets.get(this.id)
    return walletState ? walletState.accounts.length > 0 : false
  }

  public get isActive(): boolean {
    const state = this.store.state
    return state.activeWallet === this.id
  }

  // ---------- Protected Methods ------------------------------------- //

  protected onDisconnect(): void {
    removeWallet(this.store, { walletId: this.id })
  }
}
