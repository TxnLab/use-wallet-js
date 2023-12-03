import { WalletId } from './constants'
import { DeflyWallet } from './defly'
import { ExodusWallet } from './exodus'
import { KmdWallet } from './kmd'
import { MnemonicWallet } from './mnemonic'
import { MyAlgoWallet } from './myalgo'
import { PeraWallet } from './pera'
import { WalletMap } from './types'
import { WalletConnect } from './walletconnect'

export function createWalletMap(): WalletMap {
  return {
    [WalletId.DEFLY]: DeflyWallet,
    [WalletId.EXODUS]: ExodusWallet,
    [WalletId.KMD]: KmdWallet,
    [WalletId.MNEMONIC]: MnemonicWallet,
    [WalletId.MYALGO]: MyAlgoWallet,
    [WalletId.PERA]: PeraWallet,
    [WalletId.WALLETCONNECT]: WalletConnect
  }
}
