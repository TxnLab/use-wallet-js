import type { EncodedSignedTransaction, EncodedTransaction, Transaction } from 'algosdk'

export function isTransaction(item: Transaction | Uint8Array | Uint8Array[]): item is Transaction {
  return (item as Transaction).genesisID !== undefined
}

export function isSignedTxnObject(
  item: EncodedTransaction | EncodedSignedTransaction
): item is EncodedSignedTransaction {
  return (item as EncodedSignedTransaction).txn !== undefined
}
