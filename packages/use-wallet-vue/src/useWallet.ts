import { type State, WalletManager } from '@txnlab/use-wallet-js'
import type algosdk from 'algosdk'
import { inject, computed } from 'vue'

export function useWallet() {
  const manager = inject<WalletManager>('walletManager')
  const state = inject<State>('walletState')

  if (!manager || !state) {
    throw new Error('WalletManager plugin is not properly installed')
  }

  const activeNetwork = computed(() => state.activeNetwork)
  const activeWallet = computed(() => state.activeWallet)

  const wallets = manager.wallets
  const algodClient: algosdk.Algodv2 = manager.algodClient
  const blockExplorer = manager.blockExplorer
  const chainId = manager.chainId
  const activeWalletAccounts = manager.activeWalletAccounts
  const activeWalletAddresses = manager.activeWalletAddresses
  const activeAccount = manager.activeAccount
  const activeAddress = manager.activeAddress
  const setActiveNetwork = manager.setActiveNetwork

  const signTransactions = (
    txnGroup: algosdk.Transaction[] | algosdk.Transaction[][] | Uint8Array[] | Uint8Array[][],
    indexesToSign?: number[],
    returnGroup?: boolean
  ) => {
    if (!activeWallet.value) {
      throw new Error('No active wallet')
    }
    return manager.signTransactions(txnGroup, indexesToSign, returnGroup)
  }

  const transactionSigner = (txnGroup: algosdk.Transaction[], indexesToSign: number[]) => {
    if (!activeWallet.value) {
      throw new Error('No active wallet')
    }
    return manager.transactionSigner(txnGroup, indexesToSign)
  }

  return {
    wallets,
    algodClient,
    activeNetwork: activeNetwork.value,
    blockExplorer,
    chainId,
    activeWallet: activeWallet.value,
    activeWalletAccounts,
    activeWalletAddresses,
    activeAccount,
    activeAddress,
    setActiveNetwork,
    signTransactions,
    transactionSigner
  }
}
