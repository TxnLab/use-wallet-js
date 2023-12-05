import algosdk from 'algosdk'
import { NetworkId } from 'src/network'
import { Store, StoreActions, type State } from 'src/store'
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
  protected notifySubscribers: () => void

  public subscribe: (callback: (state: State) => void) => () => void

  protected constructor({
    id,
    metadata,
    store,
    subscribe,
    onStateChange
  }: WalletConstructor<WalletId>) {
    this.id = id
    this.store = store
    this.subscribe = subscribe
    this.notifySubscribers = onStateChange

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
    this.store.dispatch(StoreActions.SET_ACTIVE_WALLET, { walletId: this.id })

    this.notifySubscribers()
  }

  public setActiveAccount(account: string): void {
    console.info(`[Wallet] Set active account: ${account}`)
    this.store.dispatch(StoreActions.SET_ACTIVE_ACCOUNT, {
      walletId: this.id,
      address: account
    })

    this.notifySubscribers()
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
    const state = this.store.getState()
    const walletState = state.wallets.get(this.id)
    return walletState ? walletState.accounts : []
  }

  public get addresses(): string[] {
    return this.accounts.map((account) => account.address)
  }

  public get activeAccount(): WalletAccount | null {
    const state = this.store.getState()
    const walletState = state.wallets.get(this.id)
    return walletState ? walletState.activeAccount : null
  }

  public get activeAddress(): string | null {
    return this.activeAccount?.address ?? null
  }

  public get activeNetwork(): NetworkId {
    const state = this.store.getState()
    return state.activeNetwork
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

  // ---------- Protected Methods ------------------------------------- //

  protected onDisconnect(): void {
    this.store.dispatch(StoreActions.REMOVE_WALLET, { walletId: this.id })
    this.notifySubscribers()
  }
}
