import { Store } from '@tanstack/store'
import { NetworkId } from 'src/network'
import { WalletId, type WalletAccount } from 'src/wallets'
import type { State, WalletState } from './types'

export function addWallet(
  store: Store<State>,
  { walletId, wallet }: { walletId: WalletId; wallet: WalletState }
) {
  store.setState((state) => {
    const newWallets = new Map(state.wallets.entries())
    newWallets.set(walletId, wallet)

    return {
      ...state,
      wallets: newWallets,
      activeWallet: walletId
    }
  })
}

export function removeWallet(store: Store<State>, { walletId }: { walletId: WalletId }) {
  store.setState((state) => {
    const newWallets = new Map(state.wallets.entries())
    newWallets.delete(walletId)

    return {
      ...state,
      wallets: newWallets,
      activeWallet: state.activeWallet === walletId ? null : state.activeWallet
    }
  })
}

export function setActiveWallet(store: Store<State>, { walletId }: { walletId: WalletId | null }) {
  store.setState((state) => {
    return {
      ...state,
      activeWallet: walletId
    }
  })
}

export function setActiveAccount(
  store: Store<State>,
  { walletId, address }: { walletId: WalletId; address: string }
) {
  store.setState((state) => {
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
  })
}

export function setAccounts(
  store: Store<State>,
  { walletId, accounts }: { walletId: WalletId; accounts: WalletAccount[] }
) {
  store.setState((state) => {
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
  })
}

export function setActiveNetwork(store: Store<State>, { networkId }: { networkId: NetworkId }) {
  store.setState((state) => {
    return {
      ...state,
      activeNetwork: networkId
    }
  })
}
