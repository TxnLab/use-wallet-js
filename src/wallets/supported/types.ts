import { WalletId } from './constants'
import { WalletIdConfig } from '../types'
import { DeflyWallet, type DeflyWalletConnectOptions } from './defly'
import { ExodusWallet, type ExodusOptions } from './exodus'
import { KmdWallet, type KmdOptions } from './kmd'
import { MnemonicWallet, type MnemonicOptions } from './mnemonic'
import { PeraWallet, type PeraWalletConnectOptions } from './pera'
import { WalletConnect, type WalletConnectOptions } from './walletconnect'

export type WalletMap = {
  [WalletId.DEFLY]: typeof DeflyWallet
  [WalletId.EXODUS]: typeof ExodusWallet
  [WalletId.KMD]: typeof KmdWallet
  [WalletId.MNEMONIC]: typeof MnemonicWallet
  [WalletId.PERA]: typeof PeraWallet
  [WalletId.WALLETCONNECT]: typeof WalletConnect
}

export type WalletOptionsMap = {
  [WalletId.DEFLY]: DeflyWalletConnectOptions
  [WalletId.EXODUS]: ExodusOptions
  [WalletId.KMD]: KmdOptions
  [WalletId.MNEMONIC]: MnemonicOptions
  [WalletId.PERA]: PeraWalletConnectOptions
  [WalletId.WALLETCONNECT]: WalletConnectOptions
}

export type SupportedWallet =
  | WalletIdConfig<WalletId.DEFLY>
  | WalletIdConfig<WalletId.EXODUS>
  | WalletIdConfig<WalletId.KMD>
  | WalletIdConfig<WalletId.MNEMONIC>
  | WalletIdConfig<WalletId.PERA>
  | WalletIdConfig<WalletId.WALLETCONNECT>
  | WalletId.DEFLY
  | WalletId.EXODUS
  | WalletId.KMD
  | WalletId.MNEMONIC
  | WalletId.PERA
