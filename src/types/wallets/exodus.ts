/** @see https://docs.exodus.com/api-reference/algorand-provider-arc-api/ */

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

export interface WalletTransaction {
  // Base64 encoding of the canonical msgpack encoding of a Transaction.
  txn: string

  // Optional authorized address used to sign the transaction when the account
  // is rekeyed. Also called the signor/sgnr.
  authAddr?: string

  // Optional list of addresses that must sign the transactions
  signers?: string[]

  // Optional base64 encoding of the canonical msgpack encoding of a
  // SignedTxn corresponding to txn, when signers=[]
  stxn?: string
}

export type SignTxnsResult = (string | null)[]

export type Exodus = {
  isConnected: boolean
  address: string | null
  enable: (options?: ExodusOptions) => Promise<EnableResult>
  signTxns: (transactions: WalletTransaction[]) => Promise<SignTxnsResult>
}

export type WindowExtended = { algorand: Exodus } & Window & typeof globalThis
