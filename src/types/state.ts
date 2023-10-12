import type { NetworkId, WALLET_ID } from 'src/constants'
import type { Store } from 'src/store/store'
import type { WalletAccount } from 'src/types/wallet'

export type WalletState = {
  accounts: WalletAccount[]
  activeAccount: WalletAccount | null
}

export interface State {
  wallets: Map<WALLET_ID, WalletState>
  activeWallet: WALLET_ID | null
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
  [StoreMutations.ADD_WALLET]: { walletId: WALLET_ID; wallet: WalletState }
  [StoreMutations.REMOVE_WALLET]: { walletId: WALLET_ID }
  [StoreMutations.SET_ACTIVE_WALLET]: { walletId: WALLET_ID | null }
  [StoreMutations.SET_ACTIVE_ACCOUNT]: { walletId: WALLET_ID; address: string }
  [StoreMutations.SET_ACCOUNTS]: { walletId: WALLET_ID; accounts: WalletAccount[] }
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
  [StoreActions.ADD_WALLET]: { walletId: WALLET_ID; wallet: WalletState }
  [StoreActions.REMOVE_WALLET]: { walletId: WALLET_ID }
  [StoreActions.SET_ACTIVE_WALLET]: { walletId: WALLET_ID | null }
  [StoreActions.SET_ACTIVE_ACCOUNT]: { walletId: WALLET_ID; address: string }
  [StoreActions.SET_ACCOUNTS]: { walletId: WALLET_ID; accounts: WalletAccount[] }
  [StoreActions.SET_ACTIVE_NETWORK]: { networkId: NetworkId }
}

export interface Mutations<S extends object> {
  addWallet: (state: S, payload: { walletId: WALLET_ID; wallet: WalletState }) => S
  removeWallet: (state: S, payload: { walletId: WALLET_ID }) => S
  setActiveWallet: (state: S, payload: { walletId: WALLET_ID | null }) => S
  setActiveAccount: (state: S, payload: { walletId: WALLET_ID; address: string }) => S
  setAccounts: (state: S, payload: { walletId: WALLET_ID; accounts: WalletAccount[] }) => S
  setActiveNetwork: (state: S, payload: { networkId: NetworkId }) => S
}

export interface Actions<S extends object> {
  addWallet: (context: Store<S>, payload: { walletId: WALLET_ID; wallet: WalletState }) => void
  removeWallet: (context: Store<S>, payload: { walletId: WALLET_ID }) => void
  setActiveWallet: (context: Store<S>, payload: { walletId: WALLET_ID | null }) => void
  setActiveAccount: (context: Store<S>, payload: { walletId: WALLET_ID; address: string }) => void
  setAccounts: (
    context: Store<S>,
    payload: { walletId: WALLET_ID; accounts: WalletAccount[] }
  ) => void
  setActiveNetwork: (context: Store<S>, payload: { networkId: NetworkId }) => void
}
