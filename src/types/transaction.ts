import type { Transaction, TransactionSigner } from 'algosdk'

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
