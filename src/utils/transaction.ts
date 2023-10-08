import algosdk from 'algosdk'
import type { EncodedSignedTransaction, EncodedTransaction } from 'algosdk'
import type { JsonRpcRequest } from 'src/types/transaction'

export function isTransaction(
  item: algosdk.Transaction | algosdk.Transaction[] | Uint8Array | Uint8Array[]
): item is algosdk.Transaction | algosdk.Transaction[] {
  if (Array.isArray(item)) {
    return item.every(
      (elem) =>
        typeof elem === 'object' &&
        elem !== null &&
        'genesisID' in elem &&
        typeof elem.genesisID === 'string'
    )
  } else {
    return (
      typeof item === 'object' &&
      item !== null &&
      'genesisID' in item &&
      typeof item.genesisID === 'string'
    )
  }
}

export function isSignedTxnObject(
  item: EncodedTransaction | EncodedSignedTransaction
): item is EncodedSignedTransaction {
  return (item as EncodedSignedTransaction).txn !== undefined
}

export function normalizeTxnGroup(
  txnGroup: algosdk.Transaction[] | algosdk.Transaction[][] | Uint8Array[] | Uint8Array[][]
): Uint8Array[] {
  if (!txnGroup[0]) {
    throw new Error('Empty transaction group!')
  }

  const isTransactionType = isTransaction(txnGroup[0])

  // Handle `algosdk.Transaction[] | algosdk.Transaction[]` types
  if (isTransactionType) {
    const transactionGroup: algosdk.Transaction[] = Array.isArray(txnGroup[0])
      ? (txnGroup as algosdk.Transaction[][]).flatMap((txn) => txn)
      : (txnGroup as algosdk.Transaction[])

    return transactionGroup.map((txn) => {
      return algosdk.encodeUnsignedTransaction(txn)
    })
  }

  // Handle `Uint8Array[] | Uint8Array[][]` types
  else {
    const transactionGroup: Uint8Array[] = Array.isArray(txnGroup[0])
      ? (txnGroup as Uint8Array[][]).flatMap((txn) => txn)
      : (txnGroup as Uint8Array[])

    return transactionGroup
  }
}

export function shouldSignTxnObject(
  txnObject: any,
  addresses: string[],
  indexesToSign: number[] | undefined,
  idx: number
): boolean {
  const isIndexMatch = !indexesToSign || indexesToSign.includes(idx)
  const isSigned = isSignedTxnObject(txnObject)
  const canSign = !isSigned && addresses.includes(algosdk.encodeAddress(txnObject.snd))
  const shouldSign = isIndexMatch && canSign

  return shouldSign
}

export function mergeSignedTxnsWithGroup(
  signedTxns: Uint8Array[],
  txnGroup: Uint8Array[],
  signedIndexes: number[],
  returnGroup: boolean
): Uint8Array[] {
  return txnGroup.reduce<Uint8Array[]>((acc, txn, i) => {
    if (signedIndexes.includes(i)) {
      const signedByUser = signedTxns.shift()
      signedByUser && acc.push(signedByUser)
    } else if (returnGroup) {
      acc.push(txnGroup[i]!)
    }
    return acc
  }, [])
}

function getPayloadId(): number {
  const date = Date.now() * Math.pow(10, 3)
  const extra = Math.floor(Math.random() * Math.pow(10, 3))
  return date + extra
}

export function formatJsonRpcRequest<T = any>(method: string, params: T): JsonRpcRequest<T> {
  return {
    id: getPayloadId(),
    jsonrpc: '2.0',
    method,
    params
  }
}
