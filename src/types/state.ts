import type { NetworkId, WalletId } from 'src/constants'
import type { Store } from 'src/store/store'
import type { WalletAccount } from 'src/types/wallet'

export type WalletState = {
  accounts: WalletAccount[]
  activeAccount: WalletAccount | null
}

export interface State {
  wallets: Map<WalletId, WalletState>
  activeWallet: WalletId | null
  activeNetwork: NetworkId
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
  SET_ACTIVE_ACCOUNT = 'setActiveAccount',
  SET_ACCOUNTS = 'setAccounts',
  SET_ACTIVE_NETWORK = 'setActiveNetwork'
}

export interface MutationPayloads {
  [StoreMutations.ADD_WALLET]: { walletId: WalletId; wallet: WalletState }
  [StoreMutations.REMOVE_WALLET]: { walletId: WalletId }
  [StoreMutations.SET_ACTIVE_WALLET]: { walletId: WalletId | null }
  [StoreMutations.SET_ACTIVE_ACCOUNT]: { walletId: WalletId; address: string }
  [StoreMutations.SET_ACCOUNTS]: { walletId: WalletId; accounts: WalletAccount[] }
  [StoreMutations.SET_ACTIVE_NETWORK]: { networkId: NetworkId }
}

export enum StoreActions {
  ADD_WALLET = 'addWallet',
  REMOVE_WALLET = 'removeWallet',
  SET_ACTIVE_WALLET = 'setActiveWallet',
  SET_ACTIVE_ACCOUNT = 'setActiveAccount',
  SET_ACCOUNTS = 'setAccounts',
  SET_ACTIVE_NETWORK = 'setActiveNetwork'
}

export interface ActionPayloads {
  [StoreActions.ADD_WALLET]: { walletId: WalletId; wallet: WalletState }
  [StoreActions.REMOVE_WALLET]: { walletId: WalletId }
  [StoreActions.SET_ACTIVE_WALLET]: { walletId: WalletId | null }
  [StoreActions.SET_ACTIVE_ACCOUNT]: { walletId: WalletId; address: string }
  [StoreActions.SET_ACCOUNTS]: { walletId: WalletId; accounts: WalletAccount[] }
  [StoreActions.SET_ACTIVE_NETWORK]: { networkId: NetworkId }
}

export interface Mutations<S extends object> {
  addWallet: (state: S, payload: { walletId: WalletId; wallet: WalletState }) => S
  removeWallet: (state: S, payload: { walletId: WalletId }) => S
  setActiveWallet: (state: S, payload: { walletId: WalletId | null }) => S
  setActiveAccount: (state: S, payload: { walletId: WalletId; address: string }) => S
  setAccounts: (state: S, payload: { walletId: WalletId; accounts: WalletAccount[] }) => S
  setActiveNetwork: (state: S, payload: { networkId: NetworkId }) => S
}

export interface Actions<S extends object> {
  addWallet: (context: Store<S>, payload: { walletId: WalletId; wallet: WalletState }) => void
  removeWallet: (context: Store<S>, payload: { walletId: WalletId }) => void
  setActiveWallet: (context: Store<S>, payload: { walletId: WalletId | null }) => void
  setActiveAccount: (context: Store<S>, payload: { walletId: WalletId; address: string }) => void
  setAccounts: (
    context: Store<S>,
    payload: { walletId: WalletId; accounts: WalletAccount[] }
  ) => void
  setActiveNetwork: (context: Store<S>, payload: { networkId: NetworkId }) => void
}
