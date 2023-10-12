import type { NetworkId, WALLET_ID } from 'src/constants'
import type { Mutations, State, WalletState } from 'src/types/state'
import type { WalletAccount } from 'src/types/wallet'

export const mutations: Mutations<State> = {
  addWallet(state: State, { walletId, wallet }: { walletId: WALLET_ID; wallet: WalletState }) {
    const newWallets = new Map(state.wallets.entries())
    newWallets.set(walletId, wallet)

    return {
      ...state,
      wallets: newWallets,
      activeWallet: walletId
    }
  },
  removeWallet(state: State, { walletId }: { walletId: WALLET_ID }) {
    const newWallets = new Map(state.wallets.entries())
    newWallets.delete(walletId)

    return {
      ...state,
      wallets: newWallets,
      activeWallet: state.activeWallet === walletId ? null : state.activeWallet
    }
  },
  setActiveWallet(state: State, { walletId }: { walletId: WALLET_ID | null }) {
    return {
      ...state,
      activeWallet: walletId
    }
  },
  setActiveAccount(state: State, { walletId, address }: { walletId: WALLET_ID; address: string }) {
    const wallet = state.wallets.get(walletId)
    if (!wallet) {
      return state
    }
    const activeAccount = wallet.accounts.find((a) => a.address === address)
    if (!activeAccount) {
      return state
    }

    const newWallets = new Map(state.wallets.entries())
    newWallets.set(walletId, {
      ...wallet,
      activeAccount: activeAccount
    })

    return {
      ...state,
      wallets: newWallets
    }
  },
  setAccounts(
    state: State,
    { walletId, accounts }: { walletId: WALLET_ID; accounts: WalletAccount[] }
  ) {
    const wallet = state.wallets.get(walletId)
    if (!wallet) {
      return state
    }

    // Check if `accounts` includes `wallet.activeAccount`
    const isActiveAccountConnected = accounts.some(
      (account) => account.address === wallet.activeAccount?.address
    )

    const activeAccount = isActiveAccountConnected ? wallet.activeAccount! : accounts[0] || null

    const newWallet = {
      ...wallet,
      accounts,
      activeAccount
    }

    // Create a new Map with the updated wallet
    const newWallets = new Map(state.wallets.entries())
    newWallets.set(walletId, newWallet)

    return {
      ...state,
      wallets: newWallets
    }
  },
  setActiveNetwork(state: State, { networkId }: { networkId: NetworkId }) {
    return {
      ...state,
      activeNetwork: networkId
    }
  }
}
