import { StoreMutations } from './mutations'
import type { NetworkId } from 'src/network'
import type { Store } from 'src/store'
import type { WalletAccount, WalletId } from 'src/wallets'
import type { State, WalletState } from './types'

export enum StoreActions {
  ADD_WALLET = 'addWallet',
  REMOVE_WALLET = 'removeWallet',
  SET_ACTIVE_WALLET = 'setActiveWallet',
  SET_ACTIVE_ACCOUNT = 'setActiveAccount',
  SET_ACCOUNTS = 'setAccounts',
  SET_ACTIVE_NETWORK = 'setActiveNetwork'
}

export interface Actions<TState extends object> {
  addWallet: (context: Store<TState>, payload: { walletId: WalletId; wallet: WalletState }) => void
  removeWallet: (context: Store<TState>, payload: { walletId: WalletId }) => void
  setActiveWallet: (context: Store<TState>, payload: { walletId: WalletId | null }) => void
  setActiveAccount: (
    context: Store<TState>,
    payload: { walletId: WalletId; address: string }
  ) => void
  setAccounts: (
    context: Store<TState>,
    payload: { walletId: WalletId; accounts: WalletAccount[] }
  ) => void
  setActiveNetwork: (context: Store<TState>, payload: { networkId: NetworkId }) => void
}

export const actions: Actions<State> = {
  addWallet(
    context: Store<State>,
    { walletId, wallet }: { walletId: WalletId; wallet: WalletState }
  ) {
    context.commit(StoreMutations.ADD_WALLET, { walletId, wallet })
  },
  removeWallet(context: Store<State>, { walletId }: { walletId: WalletId }) {
    context.commit(StoreMutations.REMOVE_WALLET, { walletId })
  },
  setActiveWallet(context: Store<State>, { walletId }: { walletId: WalletId | null }) {
    context.commit(StoreMutations.SET_ACTIVE_WALLET, { walletId })
  },
  setActiveAccount(
    context: Store<State>,
    { walletId, address }: { walletId: WalletId; address: string }
  ) {
    context.commit(StoreMutations.SET_ACTIVE_ACCOUNT, { walletId, address })
  },
  setAccounts(
    context: Store<State>,
    { walletId, accounts }: { walletId: WalletId; accounts: WalletAccount[] }
  ) {
    context.commit(StoreMutations.SET_ACCOUNTS, { walletId, accounts })
  },
  setActiveNetwork(context: Store<State>, { networkId }: { networkId: NetworkId }) {
    context.commit(StoreMutations.SET_ACTIVE_NETWORK, { networkId })
  }
}
