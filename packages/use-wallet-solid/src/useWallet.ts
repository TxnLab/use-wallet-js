import { useStore } from '@tanstack/solid-store'
import { createMemo } from 'solid-js'
import { useWalletManager } from './WalletProvider'
import type { NetworkId, WalletAccount, WalletId, WalletMetadata } from '@txnlab/use-wallet-js'
import type algosdk from 'algosdk'

export interface Wallet {
  id: string
  metadata: WalletMetadata
  accounts: WalletAccount[]
  activeAccount: WalletAccount | null
  isConnected: boolean
  isActive: () => boolean
  connect: () => Promise<WalletAccount[]>
  disconnect: () => Promise<void>
  setActive: () => void
  setActiveAccount: (address: string) => void
}

export function useWallet() {
  // Good
  const manager = createMemo(() => useWalletManager())

  // TODO: Not reactive when intDecoding is changed
  const algodClient = createMemo(() => manager().algodClient)

  // Good
  const walletStateMap = useStore(manager().store, (state) => {
    console.log('Running walletStateMap callback...', state.wallets)
    return state.wallets
  })

  // Good
  const activeWalletId = useStore(manager().store, (state) => {
    console.log('Running activeWalletId callback...', state.activeWallet)
    return state.activeWallet
  })

  // Showing promise but needs more testing
  const wallets = createMemo(() => {
    console.log('Recomputing wallets...')

    return [...manager().wallets.values()].map((wallet) => {
      const walletState = walletStateMap()[wallet.id]

      const walletObject: Wallet = {
        id: wallet.id,
        metadata: wallet.metadata,
        accounts: walletState?.accounts ?? [],
        activeAccount: walletState?.activeAccount ?? null,
        isConnected: !!walletState,
        isActive: () => wallet.id === activeWalletId(),
        connect: () => wallet.connect(),
        disconnect: () => wallet.disconnect(),
        setActive: () => wallet.setActive(),
        setActiveAccount: (addr) => wallet.setActiveAccount(addr)
      }

      return walletObject
    })
  })

  // Good
  const activeWallet = () =>
    activeWalletId() !== null ? manager().getWallet(activeWalletId() as WalletId) || null : null

  const activeWalletState = () =>
    activeWalletId() !== null ? walletStateMap()[activeWalletId() as WalletId] || null : null

  // Good
  const activeWalletAccounts = () => activeWalletState()?.accounts ?? null

  // Good
  const activeWalletAddresses = () =>
    activeWalletAccounts()?.map((account) => account.address) ?? null

  // Good
  const activeAccount = () => activeWalletState()?.activeAccount ?? null

  // Good
  const activeAddress = () => activeAccount()?.address ?? null

  // Good
  const activeNetwork = () => useStore(manager().store, (state) => state.activeNetwork) // Check if this needs to be wrapped in a function so it doesn't have to called twice ()()

  // Good
  const setActiveNetwork = (network: NetworkId) => manager().setActiveNetwork(network)

  // TODO
  const signTransactions = (
    txnGroup: algosdk.Transaction[] | algosdk.Transaction[][] | Uint8Array[] | Uint8Array[][],
    indexesToSign?: number[],
    returnGroup?: boolean
  ) => {
    if (!activeWallet) {
      throw new Error('No active wallet')
    }
    return activeWallet()?.signTransactions(txnGroup, indexesToSign, returnGroup)
  }

  // TODO
  const transactionSigner = (txnGroup: algosdk.Transaction[], indexesToSign: number[]) => {
    if (!activeWallet) {
      throw new Error('No active wallet')
    }
    return activeWallet()?.transactionSigner(txnGroup, indexesToSign)
  }

  return {
    activeWalletId,
    walletStateMap,
    wallets,
    algodClient,
    activeNetwork,
    activeWallet,
    activeWalletAccounts,
    activeWalletAddresses,
    activeAccount,
    activeAddress,
    setActiveNetwork,
    signTransactions,
    transactionSigner,
    manager
  }
}
