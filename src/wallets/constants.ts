import { createWalletMap } from './utils'

export enum WalletId {
  DEFLY = 'defly',
  EXODUS = 'exodus',
  KMD = 'kmd',
  MNEMONIC = 'mnemonic',
  MYALGO = 'myalgo',
  PERA = 'pera',
  WALLETCONNECT = 'walletconnect'
}

export const walletMap = createWalletMap()
