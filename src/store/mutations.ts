import type { WALLET_ID } from 'src/constants'
import type { State, WalletState } from 'src/types/state'

export const mutations = {
  addWallet(state: State, { walletId, wallet }: { walletId: WALLET_ID; wallet: WalletState }) {
    state.wallets.set(walletId, wallet)
    state.activeWallet = walletId
  },
  removeWallet(state: State, walletId: WALLET_ID) {
    state.wallets.delete(walletId)
    if (state.activeWallet === walletId) {
      state.activeWallet = null
    }
  },
  setActiveWallet(state: State, walletId: WALLET_ID) {
    state.activeWallet = walletId
  },
  setActiveAccount(state: State, { walletId, address }: { walletId: WALLET_ID; address: string }) {
    const wallet = state.wallets.get(walletId)
    if (!wallet) {
      return
    }
    const activeAccount = wallet.accounts.find((a) => a.address === address)
    if (!activeAccount) {
      return
    }
    wallet.activeAccount = activeAccount
  }
}
