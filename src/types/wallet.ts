import { WALLET_ID } from 'src/constants'
import type { DeflyWalletConnectOptions } from './wallets/defly'
import type { ExodusOptions } from './wallets/exodus'
import type { MyAlgoConnectOptions } from './wallets/myalgo'
import type { PeraWalletConnectOptions } from './wallets/pera'
import type { NonEmptyArray } from './utilities'
import type { Store } from 'src/store'
import type { State } from './state'

export type ClientOptionsMap = {
  [WALLET_ID.DEFLY]: DeflyWalletConnectOptions
  [WALLET_ID.EXODUS]: ExodusOptions
  [WALLET_ID.MYALGO]: MyAlgoConnectOptions
  [WALLET_ID.PERA]: PeraWalletConnectOptions
}

export type ClientConfigMap = {
  [K in keyof ClientOptionsMap]: {
    options?: ClientOptionsMap[K]
  }
}

export type ClientOptions<T extends keyof ClientOptionsMap> = ClientOptionsMap[T]

export type ClientConfig<T extends keyof ClientConfigMap> = ClientConfigMap[T]

export type WalletConfig<T extends keyof ClientConfigMap> = {
  [K in T]: {
    id: K
  } & ClientConfigMap[K]
}[T]

export type WalletDef =
  | WalletConfig<WALLET_ID.DEFLY>
  | WalletConfig<WALLET_ID.EXODUS>
  | WalletConfig<WALLET_ID.MYALGO>
  | WalletConfig<WALLET_ID.PERA>
  | WALLET_ID.DEFLY
  | WALLET_ID.EXODUS
  | WALLET_ID.MYALGO
  | WALLET_ID.PERA

export type WalletsArray = NonEmptyArray<WalletDef>

export interface WalletManagerConstructor {
  wallets: WalletsArray
}

export interface BaseConstructor {
  id: WALLET_ID
  store: Store<State>
  onStateChange: () => void
  subscribe: (callback: (state: State) => void) => () => void
}

export type WalletConstructor<T extends keyof ClientOptionsMap> = BaseConstructor & {
  options?: ClientOptions<T>
}

export type WalletAccount = {
  name: string
  address: string
}
