import { WALLET_ID } from 'src/constants'
import { Store } from 'src/store/store'
import type { WalletAccount } from './wallet'

export type WalletState = {
  accounts: WalletAccount[]
  activeAccount: WalletAccount | null
}

export interface State {
  wallets: Map<WALLET_ID, WalletState>
  activeWallet: WALLET_ID | null
}

export enum Status {
  IDLE = 'idle',
  ACTION = 'action',
  MUTATION = 'mutation'
}

export enum StoreMutations {
  ADD_WALLET = 'addWallet',
  REMOVE_WALLET = 'removeWallet',
  SET_ACTIVE_WALLET = 'setActiveWallet',
  SET_ACTIVE_ACCOUNT = 'setActiveAccount'
}

export interface MutationPayloads {
  [StoreMutations.ADD_WALLET]: { walletId: WALLET_ID; wallet: WalletState }
  [StoreMutations.REMOVE_WALLET]: WALLET_ID
  [StoreMutations.SET_ACTIVE_WALLET]: WALLET_ID
  [StoreMutations.SET_ACTIVE_ACCOUNT]: { walletId: WALLET_ID; address: string }
}

export enum StoreActions {
  ADD_WALLET = 'addWallet',
  REMOVE_WALLET = 'removeWallet',
  SET_ACTIVE_WALLET = 'setActiveWallet',
  SET_ACTIVE_ACCOUNT = 'setActiveAccount'
}

export interface ActionPayloads {
  [StoreActions.ADD_WALLET]: { walletId: WALLET_ID; wallet: WalletState }
  [StoreActions.REMOVE_WALLET]: WALLET_ID
  [StoreActions.SET_ACTIVE_WALLET]: WALLET_ID
  [StoreActions.SET_ACTIVE_ACCOUNT]: { walletId: WALLET_ID; address: string }
}

export interface Mutations<S extends object> {
  addWallet: (state: S, payload: { walletId: WALLET_ID; wallet: WalletState }) => S
  removeWallet: (state: S, walletId: WALLET_ID) => S
  setActiveWallet: (state: S, walletId: WALLET_ID) => S
  setActiveAccount: (state: S, payload: { walletId: WALLET_ID; address: string }) => S
}

export interface Actions<S extends object> {
  addWallet: (context: Store<S>, payload: { walletId: WALLET_ID; wallet: WalletState }) => void
  removeWallet: (context: Store<S>, walletId: WALLET_ID) => void
  setActiveWallet: (context: Store<S>, walletId: WALLET_ID) => void
  setActiveAccount: (context: Store<S>, payload: { walletId: WALLET_ID; address: string }) => void
}
