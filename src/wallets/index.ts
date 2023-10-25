import { BaseWallet } from './base'
import { DeflyWallet } from './defly'
import { ExodusWallet } from './exodus'
import { KmdWallet } from './kmd'
import { MnemonicWallet } from './mnemonic'
import { MyAlgoWallet } from './myalgo'
import { PeraWallet } from './pera'
import { WalletConnect } from './walletconnect'
import { WalletId } from 'src/constants'

export type WalletMap = {
  [WalletId.DEFLY]: typeof DeflyWallet
  [WalletId.EXODUS]: typeof ExodusWallet
  [WalletId.KMD]: typeof KmdWallet
  [WalletId.MNEMONIC]: typeof MnemonicWallet
  [WalletId.MYALGO]: typeof MyAlgoWallet
  [WalletId.PERA]: typeof PeraWallet
  [WalletId.WALLETCONNECT]: typeof WalletConnect
}

function createWalletMap(): WalletMap {
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

const allWallets = createWalletMap()

export { allWallets, BaseWallet, ExodusWallet, PeraWallet }
