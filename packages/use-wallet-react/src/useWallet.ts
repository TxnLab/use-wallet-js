'use client'

import type algosdk from 'algosdk'
import { useWalletManager } from './WalletProvider'

export function useWallet() {
  const { manager, state } = useWalletManager()

  const { activeNetwork, activeWallet } = state

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
    indexesToSign?: number[] | undefined,
    returnGroup?: boolean | undefined
  ) => {
    if (!activeWallet) {
      throw new Error('No active wallet')
    }
    return manager.signTransactions(txnGroup, indexesToSign, returnGroup)
  }

  const transactionSigner = (txnGroup: algosdk.Transaction[], indexesToSign: number[]) => {
    if (!activeWallet) {
      throw new Error('No active wallet')
    }
    return manager.transactionSigner(txnGroup, indexesToSign)
  }

  return {
    wallets,
    algodClient,
    activeNetwork,
    blockExplorer,
    chainId,
    activeWallet,
    activeWalletAccounts,
    activeWalletAddresses,
    activeAccount,
    activeAddress,
    setActiveNetwork,
    signTransactions,
    transactionSigner
  }
}
