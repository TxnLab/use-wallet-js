import type { Store } from './store'
import type { WALLET_ID } from 'src/constants'
import { StoreMutations, type State, type WalletState } from 'src/types/state'

export const actions = {
  addWallet(
    context: Store<State>,
    { walletId, wallet }: { walletId: WALLET_ID; wallet: WalletState }
  ) {
    context.commit(StoreMutations.ADD_WALLET, { walletId, wallet })
  },
  removeWallet(context: Store<State>, walletId: WALLET_ID) {
    context.commit(StoreMutations.REMOVE_WALLET, walletId)
  },
  setActiveWallet(context: Store<State>, walletId: WALLET_ID) {
    context.commit(StoreMutations.SET_ACTIVE_WALLET, walletId)
  },
  setActiveAccount(
    context: Store<State>,
    { walletId, address }: { walletId: WALLET_ID; address: string }
  ) {
    context.commit(StoreMutations.SET_ACTIVE_ACCOUNT, { walletId, address })
  }
}
