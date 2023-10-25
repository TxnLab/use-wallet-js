import type { NetworkId, WalletId } from 'src/constants'
import type { Store } from 'src/store'
import type { BaseWallet } from 'src/wallets/base'
import type { NetworkConfig } from './network'
import type { State } from './state'
import type { NonEmptyArray } from './utilities'
import type { DeflyWalletConnectOptions } from './wallets/defly'
import type { ExodusOptions } from './wallets/exodus'
import type { KmdOptions } from './wallets/kmd'
import type { MnemonicOptions } from './wallets/mnemonic'
import type { MyAlgoConnectOptions } from './wallets/myalgo'
import type { PeraWalletConnectOptions } from './wallets/pera'
import type { WalletConnectOptions } from './wallets/walletconnect'

export type WalletOptionsMap = {
  [WalletId.DEFLY]: DeflyWalletConnectOptions
  [WalletId.EXODUS]: ExodusOptions
  [WalletId.KMD]: KmdOptions
  [WalletId.MNEMONIC]: MnemonicOptions
  [WalletId.MYALGO]: MyAlgoConnectOptions
  [WalletId.PERA]: PeraWalletConnectOptions
  [WalletId.WALLETCONNECT]: WalletConnectOptions
}

export type WalletConfigMap = {
  [K in keyof WalletOptionsMap]: {
    options?: WalletOptionsMap[K]
    metadata?: Partial<WalletMetadata>
  }
}

export type WalletOptions<T extends keyof WalletOptionsMap> = WalletOptionsMap[T]

export type WalletConfig<T extends keyof WalletConfigMap> = WalletConfigMap[T]

export type WalletIdConfig<T extends keyof WalletConfigMap> = {
  [K in T]: {
    id: K
  } & WalletConfigMap[K]
}[T]

export type SupportedWallet =
  | WalletIdConfig<WalletId.DEFLY>
  | WalletIdConfig<WalletId.EXODUS>
  | WalletIdConfig<WalletId.KMD>
  | WalletIdConfig<WalletId.MNEMONIC>
  | WalletIdConfig<WalletId.MYALGO>
  | WalletIdConfig<WalletId.PERA>
  | WalletIdConfig<WalletId.WALLETCONNECT>
  | WalletId.DEFLY
  | WalletId.EXODUS
  | WalletId.KMD
  | WalletId.MNEMONIC
  | WalletId.MYALGO
  | WalletId.PERA

export type SupportedWallets = NonEmptyArray<SupportedWallet>

export interface WalletManagerConstructor {
  wallets: SupportedWallets
  network?: NetworkId
  algod?: NetworkConfig
}

export type WalletMetadata = {
  name: string
  icon: string
}

export interface WalletConstructorType {
  new (...args: any[]): BaseWallet
  defaultMetadata: WalletMetadata
}

export interface BaseWalletConstructor {
  id: WalletId
  metadata: Partial<WalletMetadata> | undefined
  store: Store<State>
  onStateChange: () => void
  subscribe: (callback: (state: State) => void) => () => void
}

export type WalletConstructor<T extends keyof WalletOptionsMap> = BaseWalletConstructor & {
  options?: WalletOptions<T>
  defaultMetadata?: WalletMetadata
}

export type WalletAccount = {
  name: string
  address: string
}
