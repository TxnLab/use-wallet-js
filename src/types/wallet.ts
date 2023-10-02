import { WALLET_ID } from 'src/constants'
import type { ExodusOptions } from './exodus'
import type { PeraWalletConnectOptions } from './pera'
import type { NonEmptyArray } from './utilities'
import type { WalletClient } from 'src/clients'
import type { WalletManager } from 'src/manager'
import type { Store } from 'src/store'
import type { State } from './state'

export type ClientConfigMap = {
  [WALLET_ID.PERA]: {
    options?: PeraWalletConnectOptions
  }
  [WALLET_ID.EXODUS]: {
    options?: ExodusOptions
  }
}

export type ClientConfig<T extends keyof ClientConfigMap> = ClientConfigMap[T]

export type WalletConfig<T extends keyof ClientConfigMap> = {
  [K in T]: {
    id: K
  } & ClientConfigMap[K]
}[T]

export type WalletDef =
  | WalletConfig<WALLET_ID.PERA>
  | WalletConfig<WALLET_ID.EXODUS>
  | WALLET_ID.EXODUS

export type WalletsArray = NonEmptyArray<WalletDef>

export interface WalletManagerConstructor {
  wallets: WalletsArray
}

export interface WalletConstructor {
  id: WALLET_ID
  client: WalletClient
  manager: WalletManager
  store: Store<State>
}

export type WalletAccount = {
  name: string
  address: string
}
