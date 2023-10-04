import algosdk from 'algosdk'
import { WalletClient } from './base'
import { WALLET_ID } from 'src/constants'
import { isTransaction, isSignedTxnObject } from 'src/utils/transaction'
import type { EncodedSignedTransaction, EncodedTransaction, Transaction } from 'algosdk'
import type { Exodus, ExodusOptions, WindowExtended } from 'src/types/clients/exodus'
import type { ClientConfig, WalletAccount, ClientConfigMap } from 'src/types/wallet'

export class ExodusClient extends WalletClient {
  private client: Exodus
  private options: ExodusOptions

  constructor(client: Exodus, options: ExodusOptions) {
    super(WALLET_ID.EXODUS)
    this.client = client
    this.options = options
  }

  public static initialize<T extends keyof ClientConfigMap>({
    options
  }: ClientConfig<T> = {}): ExodusClient | null {
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

  public async connect(): Promise<WalletAccount[]> {
    try {
      const { address } = await this.client.connect({
        onlyIfTrusted: this.options.onlyIfTrusted
      })

      if (!address) {
        throw new Error('No accounts found!')
      }

      const walletAccounts = [
        {
          name: `Exodus 1`,
          address
        }
      ]

      return walletAccounts
    } catch (error: any) {
      console.error(error)
      return []
    }
  }

  public async disconnect(): Promise<void> {
    return
  }

  public async resumeSession(onDisconnect: () => void): Promise<void> {
    if (
      window === undefined ||
      (window as WindowExtended).exodus === undefined ||
      (window as WindowExtended).exodus.algorand.isConnected !== true
    ) {
      onDisconnect()
    }
  }

  public async transactionSigner(
    connectedAccounts: string[],
    txnGroup: Transaction[] | Uint8Array[] | Uint8Array[][],
    indexesToSign?: number[],
    returnGroup = true
  ): Promise<Uint8Array[]> {
    if (!txnGroup[0]) {
      throw new Error('Empty transaction group!')
    }
    const txnsToSign: Uint8Array[] = []
    const signedIndexes: number[] = []

    const isTransactionType = isTransaction(txnGroup[0])

    // Handle `Transaction[]` group transaction
    if (isTransactionType) {
      const transactionGroup = txnGroup as Transaction[]

      // Marshal transactions to sign into `Uint8Array[]`
      transactionGroup.forEach((txn, idx) => {
        const isIndexMatch = !indexesToSign || indexesToSign.includes(idx)
        const canSign = connectedAccounts.includes(algosdk.encodeAddress(txn.from.publicKey))
        const shouldSign = isIndexMatch && canSign
        const transaction = algosdk.encodeUnsignedTransaction(txn)

        if (shouldSign) {
          txnsToSign.push(transaction)
          signedIndexes.push(idx)
        }
      })

      // Sign transactions
      const signerResult = await this.client.signTransaction(txnsToSign)
      return signerResult
    }

    // Handle `Uint8Array[]` group transaction(s)
    else {
      const uintTxnGroup = txnGroup.flat() as Uint8Array[]

      // Decode transactions to access properties
      const encodedTxnObjects = uintTxnGroup.map((txn) => {
        return algosdk.decodeObj(txn)
      }) as Array<EncodedTransaction | EncodedSignedTransaction>

      // Marshal transactions to sign into `Uint8Array[]`
      encodedTxnObjects.forEach((txn, idx) => {
        const isIndexMatch = !indexesToSign || indexesToSign.includes(idx)
        const isSigned = isSignedTxnObject(txn)
        const canSign = !isSigned && connectedAccounts.includes(algosdk.encodeAddress(txn.snd))
        const shouldSign = isIndexMatch && canSign

        const encodedTxn = uintTxnGroup[idx] as Uint8Array

        if (shouldSign) {
          txnsToSign.push(encodedTxn)
          signedIndexes.push(idx)
        }
      })

      // Sign transactions
      const result = await this.client.signTransaction(txnsToSign)

      // Merge signed transactions back into original `Uint8Array[]` group
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
