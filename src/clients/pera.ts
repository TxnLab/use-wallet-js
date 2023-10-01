import { PeraWalletConnect } from '@perawallet/connect'
import algosdk from 'algosdk'
import { WalletClient } from './base'
import { WALLET_ID } from 'src/constants'
import { isTransaction, isSignedTxnObject } from 'src/utils/transaction'
import type { EncodedSignedTransaction, EncodedTransaction, Transaction } from 'algosdk'
import type { PeraWalletConnectOptions } from 'src/types/pera'
import type { SignerTransaction } from 'src/types/transaction'
import type { ClientConfig, ClientConfigMap, WalletAccount } from 'src/types/wallet'

export class PeraClient extends WalletClient {
  private client: PeraWalletConnect

  constructor(client: PeraWalletConnect) {
    super(WALLET_ID.PERA)
    this.client = client
  }

  public static initialize<T extends keyof ClientConfigMap>({
    options
  }: ClientConfig<T> = {}): PeraClient {
    const client = new PeraWalletConnect(options as PeraWalletConnectOptions)
    return new PeraClient(client)
  }

  public async connect(onDisconnect: () => void): Promise<WalletAccount[]> {
    try {
      const accounts = await this.client.connect()
      this.client.connector?.on('disconnect', onDisconnect)

      if (accounts.length === 0) {
        throw new Error('No accounts found!')
      }

      const walletAccounts = accounts.map((address: string, idx: number) => ({
        name: `Pera Wallet ${idx + 1}`,
        address
      }))

      return walletAccounts
    } catch (error: any) {
      if (error?.data?.type !== 'CONNECT_MODAL_CLOSED') {
        console.error(error)
      }
      return []
    }
  }

  public async disconnect(): Promise<void> {
    await this.client.disconnect()
  }

  public async reconnect(onDisconnect: () => void): Promise<WalletAccount[]> {
    try {
      const accounts = await this.client.reconnectSession()
      this.client.connector?.on('disconnect', onDisconnect)

      if (accounts.length === 0) {
        throw new Error('No accounts found!')
      }

      const walletAccounts = accounts.map((address: string, idx: number) => ({
        name: `Pera Wallet ${idx + 1}`,
        address
      }))

      return walletAccounts
    } catch (error: any) {
      console.error(error)
      onDisconnect()
      return []
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
    const txnsToSign: SignerTransaction[] = []
    const signedIndexes: number[] = []

    const isTransactionType = isTransaction(txnGroup[0])

    // Handle `Transaction[]` group transaction
    if (isTransactionType) {
      const transactionGroup = txnGroup as Transaction[]

      // Marshal transactions to sign into `SignerTransaction[]`
      transactionGroup.forEach((txn, idx) => {
        const isIndexMatch = !indexesToSign || indexesToSign.includes(idx)
        const canSign = connectedAccounts.includes(algosdk.encodeAddress(txn.from.publicKey))
        const shouldSign = isIndexMatch && canSign

        if (shouldSign) {
          txnsToSign.push({ txn: txn })
          signedIndexes.push(idx)
        } else {
          txnsToSign.push({ txn: txn, signers: [] })
        }
      })

      // Sign transactions
      const signerResult = await this.client.signTransaction([txnsToSign])
      return signerResult
    }

    // Handle `Uint8Array[]` group transaction(s)
    else {
      const uintTxnGroup = txnGroup.flat() as Uint8Array[]

      // Decode transactions to access properties
      const encodedTxnObjects = uintTxnGroup.map((txn) => {
        return algosdk.decodeObj(txn)
      }) as Array<EncodedTransaction | EncodedSignedTransaction>

      // Marshal transactions to sign into `SignerTransaction[]`
      encodedTxnObjects.forEach((txn, idx) => {
        const isIndexMatch = !indexesToSign || indexesToSign.includes(idx)
        const isSigned = isSignedTxnObject(txn)
        const canSign = !isSigned && connectedAccounts.includes(algosdk.encodeAddress(txn.snd))
        const shouldSign = isIndexMatch && canSign

        const encodedTxn = uintTxnGroup[idx] as Uint8Array
        const transaction = isSigned
          ? algosdk.decodeSignedTransaction(encodedTxn).txn
          : algosdk.decodeUnsignedTransaction(encodedTxn)

        if (shouldSign) {
          txnsToSign.push({ txn: transaction as Transaction })
          signedIndexes.push(idx)
        } else {
          txnsToSign.push({ txn: transaction as Transaction, signers: [] })
        }
      })

      // Sign transactions
      const result = await this.client.signTransaction([txnsToSign])

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
