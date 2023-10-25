import { Actions, StoreMutations, type State, type WalletState } from 'src/types/state'
import type { NetworkId, WalletId } from 'src/constants'
import type { Store } from 'src/store'
import type { WalletAccount } from 'src/types/wallet'

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
