import type { Transaction, TransactionSigner } from 'algosdk'
import type { NetworkConfig, NetworkId } from 'src/network'
import type { State, Store } from 'src/store'
import type { BaseWallet } from './base'
import type { WalletId } from './constants'
import type { DeflyWallet, DeflyWalletConnectOptions } from './supported/defly'
import type { ExodusOptions, ExodusWallet } from './supported/exodus'
import type { KmdOptions, KmdWallet } from './supported/kmd'
import type { MnemonicOptions, MnemonicWallet } from './supported/mnemonic'
import type { MyAlgoConnectOptions, MyAlgoWallet } from './supported/myalgo'
import type { PeraWallet, PeraWalletConnectOptions } from './supported/pera'
import type { WalletConnect, WalletConnectOptions } from './supported/walletconnect'

export type WalletMap = {
  [WalletId.DEFLY]: typeof DeflyWallet
  [WalletId.EXODUS]: typeof ExodusWallet
  [WalletId.KMD]: typeof KmdWallet
  [WalletId.MNEMONIC]: typeof MnemonicWallet
  [WalletId.MYALGO]: typeof MyAlgoWallet
  [WalletId.PERA]: typeof PeraWallet
  [WalletId.WALLETCONNECT]: typeof WalletConnect
}

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

type NonEmptyArray<T> = [T, ...T[]]

export type SupportedWallets = NonEmptyArray<SupportedWallet>

export interface WalletManagerConstructor {
  wallets: SupportedWallets
  network?: NetworkId
  algod?: NetworkConfig
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

export type WalletMetadata = {
  name: string
  icon: string
}

export type WalletAccount = {
  name: string
  address: string
}

// Transaction types

/** @see https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0001.md#interface-multisigmetadata */
export interface MultisigMetadata {
  /**
   * Multisig version.
   */
  version: number

  /**
   * Multisig threshold value. Authorization requires a subset of signatures,
   * equal to or greater than the threshold value.
   */
  threshold: number

  /**
   * List of Algorand addresses of possible signers for this
   * multisig. Order is important.
   */
  addrs: string[]
}

/** @see https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0001.md#interface-wallettransaction */
export interface WalletTransaction {
  /**
   * Base64 encoding of the canonical msgpack encoding of a Transaction.
   */
  txn: string

  /**
   * Optional authorized address used to sign the transaction when the account
   * is rekeyed. Also called the signor/sgnr.
   */
  authAddr?: string

  /**
   * Multisig metadata used to sign the transaction
   */
  msig?: MultisigMetadata

  /**
   * Optional list of addresses that must sign the transactions
   */
  signers?: string[]

  /**
   * Optional base64 encoding of the canonical msgpack encoding of a
   * SignedTxn corresponding to txn, when signers=[]
   */
  stxn?: string

  /**
   * Optional message explaining the reason of the transaction
   */
  message?: string

  /**
   * Optional message explaining the reason of this group of transaction
   * Field only allowed in the first transaction of a group
   */
  groupMessage?: string
}

/** @see https://github.com/perawallet/connect/blob/1.3.3/src/util/model/peraWalletModels.ts */
export interface SignerTransaction {
  txn: Transaction

  /**
   * Optional authorized address used to sign the transaction when
   * the account is rekeyed. Also called the signor/sgnr.
   */
  authAddr?: string

  /**
   * Optional list of addresses that must sign the transactions.
   * Wallet skips to sign this txn if signers is empty array.
   * If undefined, wallet tries to sign it.
   */
  signers?: string[]

  /**
   * Optional message explaining the reason of the transaction
   */
  message?: string
}

/** @see https://github.com/algorandfoundation/algokit-utils-ts/blob/v4.0.0/src/types/account.ts#L107-L111 */
export interface TransactionSignerAccount {
  addr: Readonly<string>
  signer: TransactionSigner
}

export interface JsonRpcRequest<T = any> {
  id: number
  jsonrpc: string
  method: string
  params: T
}
