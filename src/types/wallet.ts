import { WALLET_ID } from 'src/constants'
import type { ExodusOptions } from './exodus'
import type { PeraWalletConnectOptions } from './pera'
import type { NonEmptyArray } from './utilities'

export type WalletConfigMap = {
  [WALLET_ID.PERA]: {
    options?: PeraWalletConnectOptions
  }
  [WALLET_ID.EXODUS]: {
    options?: ExodusOptions
  }
}

export type WalletConfig<T extends keyof WalletConfigMap> = {
  [K in T]: {
    id: K
  } & WalletConfigMap[K]
}[T]

export type InitializeConfig<T extends keyof WalletConfigMap> = WalletConfigMap[T]

export type WalletDef =
  | WalletConfig<WALLET_ID.PERA>
  | WalletConfig<WALLET_ID.EXODUS>
  | WALLET_ID.EXODUS

export type WalletsArray = NonEmptyArray<WalletDef>

export interface WalletManagerConfig {
  wallets: WalletsArray
}

export type WalletAccount = {
  name: string
  address: string
  walletId: WALLET_ID
}

export type Account = Omit<WalletAccount, 'walletId'>

export interface PersistedState {
  accounts: WalletAccount[]
  activeAccount: WalletAccount | null
}
