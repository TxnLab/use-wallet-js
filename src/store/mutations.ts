import type { WalletId } from 'src/constants'
import type { NetworkId } from 'src/network'
import type { WalletAccount } from 'src/types/wallet'
import type { State, WalletState } from './types'

export enum StoreMutations {
  ADD_WALLET = 'addWallet',
  REMOVE_WALLET = 'removeWallet',
  SET_ACTIVE_WALLET = 'setActiveWallet',
  SET_ACTIVE_ACCOUNT = 'setActiveAccount',
  SET_ACCOUNTS = 'setAccounts',
  SET_ACTIVE_NETWORK = 'setActiveNetwork'
}

export interface Mutations<TState extends object> {
  addWallet: (state: TState, payload: { walletId: WalletId; wallet: WalletState }) => TState
  removeWallet: (state: TState, payload: { walletId: WalletId }) => TState
  setActiveWallet: (state: TState, payload: { walletId: WalletId | null }) => TState
  setActiveAccount: (state: TState, payload: { walletId: WalletId; address: string }) => TState
  setAccounts: (state: TState, payload: { walletId: WalletId; accounts: WalletAccount[] }) => TState
  setActiveNetwork: (state: TState, payload: { networkId: NetworkId }) => TState
}

export const mutations: Mutations<State> = {
  addWallet(state: State, { walletId, wallet }: { walletId: WalletId; wallet: WalletState }) {
    const newWallets = new Map(state.wallets.entries())
    newWallets.set(walletId, wallet)

    return {
      ...state,
      wallets: newWallets,
      activeWallet: walletId
    }
  },
  removeWallet(state: State, { walletId }: { walletId: WalletId }) {
    const newWallets = new Map(state.wallets.entries())
    newWallets.delete(walletId)

    return {
      ...state,
      wallets: newWallets,
      activeWallet: state.activeWallet === walletId ? null : state.activeWallet
    }
  },
  setActiveWallet(state: State, { walletId }: { walletId: WalletId | null }) {
    return {
      ...state,
      activeWallet: walletId
    }
  },
  setActiveAccount(state: State, { walletId, address }: { walletId: WalletId; address: string }) {
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
    { walletId, accounts }: { walletId: WalletId; accounts: WalletAccount[] }
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
