/** @see https://docs.exodus.com/api-reference/algorand-provider-arc-api/ */

import { WalletTransaction } from '../transaction'

interface EnableNetworkOpts {
  genesisID?: string
  genesisHash?: string
}

interface EnableAccountsOpts {
  accounts?: string[]
}

export type ExodusOptions = EnableNetworkOpts & EnableAccountsOpts

interface EnableNetworkResult {
  genesisID: string
  genesisHash: string
}

interface EnableAccountsResult {
  accounts: string[]
}

export type EnableResult = EnableNetworkResult & EnableAccountsResult

export type SignTxnsResult = (string | null)[]

export type Exodus = {
  isConnected: boolean
  address: string | null
  enable: (options?: ExodusOptions) => Promise<EnableResult>
  signTxns: (transactions: WalletTransaction[]) => Promise<SignTxnsResult>
}

export type WindowExtended = { algorand: Exodus } & Window & typeof globalThis
