import algosdk from 'algosdk'
import { BaseClient } from './base'
import { WALLET_ID } from 'src/constants'
import { isDecodedTransaction, isSignedTxnObject } from 'src/utils/transaction'
import type { EncodedSignedTransaction, EncodedTransaction, Transaction } from 'algosdk'
import type { Exodus, ExodusOptions, WindowExtended } from 'src/types/exodus'
import type { InitializeConfig, Account, WalletConfigMap } from 'src/types/wallet'

export class ExodusClient extends BaseClient {
  #client: Exodus
  options: ExodusOptions

  constructor(client: Exodus, options: ExodusOptions) {
    super(WALLET_ID.EXODUS)
    this.#client = client
    this.options = options
  }

  static id = WALLET_ID.EXODUS

  static initialize<T extends keyof WalletConfigMap>({
    options
  }: InitializeConfig<T> = {}): ExodusClient | null {
    try {
      if (typeof window == 'undefined' || (window as WindowExtended).exodus === undefined) {
        throw new Error('Exodus is not available.')
      }
      const client = (window as WindowExtended).exodus.algorand
      const clientOptions = options || { onlyIfTrusted: false }

      return new ExodusClient(client, clientOptions as ExodusOptions)
    } catch (error: any) {
      console.error(error)
      return null
    }
  }

  async connect(): Promise<Account[]> {
    try {
      const { address } = await this.#client.connect({
        onlyIfTrusted: this.options.onlyIfTrusted
      })

      if (!address) {
        throw new Error('No accounts found!')
      }

      this.accounts = [
        {
          name: `Exodus 1`,
          address
        }
      ]

      return this.accounts
    } catch (error: any) {
      console.error(error)
      return []
    }
  }

  async disconnect(): Promise<void> {
    return
  }

  async reconnect(onDisconnect: () => void): Promise<Account[]> {
    if (
      window === undefined ||
      (window as WindowExtended).exodus === undefined ||
      (window as WindowExtended).exodus.algorand.isConnected !== true
    ) {
      onDisconnect()
    }
    return this.accounts
  }

  async transactionSigner(
    txnGroup: Transaction[] | Uint8Array[] | Uint8Array[][],
    indexesToSign?: number[],
    returnGroup = true
  ): Promise<Uint8Array[]> {
    if (!txnGroup[0]) {
      throw new Error('Empty transaction group!')
    }
    const txnsToSign: Uint8Array[] = []
    const signedIndexes: number[] = []

    const isTransactionType = isDecodedTransaction(txnGroup[0])

    if (isTransactionType) {
      const transactionGroup = txnGroup as Transaction[]

      transactionGroup.forEach((txn, idx) => {
        const isIndexMatch = !indexesToSign || indexesToSign.includes(idx)
        const shouldSign = isIndexMatch
        const transaction = algosdk.encodeUnsignedTransaction(txn)

        if (shouldSign) {
          txnsToSign.push(transaction)
          signedIndexes.push(idx)
        }
      })

      const signerResult = await this.#client.signTransaction(txnsToSign)
      return signerResult
    } else {
      const uintTxnGroup = txnGroup.flat() as Uint8Array[]

      const encodedTxnObjects = uintTxnGroup.map((txn) => {
        return algosdk.decodeObj(txn)
      }) as Array<EncodedTransaction | EncodedSignedTransaction>

      encodedTxnObjects.forEach((txn, idx) => {
        const isIndexMatch = !indexesToSign || indexesToSign.includes(idx)
        const isSigned = isSignedTxnObject(txn)
        const canSign = !isSigned
        const shouldSign = isIndexMatch && canSign

        const encodedTxn = uintTxnGroup[idx] as Uint8Array

        if (shouldSign) {
          txnsToSign.push(encodedTxn)
          signedIndexes.push(idx)
        }
      })

      const result = await this.#client.signTransaction(txnsToSign)

      const signerResult = uintTxnGroup.reduce<Uint8Array[]>((acc, txn, i) => {
        if (signedIndexes.includes(i)) {
          const signedByUser = result.shift()
          signedByUser && acc.push(signedByUser)
        } else if (returnGroup) {
          acc.push(uintTxnGroup[i] as Uint8Array)
        }
        return acc
      }, [])

      return signerResult
    }
  }
}
