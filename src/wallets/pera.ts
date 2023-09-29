import { PeraWalletConnect } from '@perawallet/connect'
import algosdk from 'algosdk'
import { BaseClient } from './base'
import { WALLET_ID } from 'src/constants'
import { isDecodedTransaction, isSignedTxnObject } from 'src/utils/transaction'
import type { EncodedSignedTransaction, EncodedTransaction, Transaction } from 'algosdk'
import type { PeraWalletConnectOptions } from 'src/types/pera'
import type { SignerTransaction } from 'src/types/transaction'
import type { InitializeConfig, WalletConfigMap, Account } from 'src/types/wallet'

export class PeraClient extends BaseClient {
  #client: PeraWalletConnect

  constructor(client: PeraWalletConnect) {
    super(WALLET_ID.PERA)
    this.#client = client
  }

  static id = WALLET_ID.PERA

  static initialize<T extends keyof WalletConfigMap>({
    options
  }: InitializeConfig<T> = {}): PeraClient {
    const client = new PeraWalletConnect(options as PeraWalletConnectOptions)
    return new PeraClient(client)
  }

  async connect(onDisconnect: () => void): Promise<Account[]> {
    try {
      const accounts = await this.#client.connect()
      this.#client.connector?.on('disconnect', onDisconnect)

      if (accounts.length === 0) {
        throw new Error('No accounts found!')
      }

      this.accounts = accounts.map((address: string, idx: number) => ({
        name: `Pera Wallet ${idx + 1}`,
        address
      }))

      return this.accounts
    } catch (error: any) {
      if (error?.data?.type !== 'CONNECT_MODAL_CLOSED') {
        console.error(error)
      }
      return []
    }
  }

  async disconnect(): Promise<void> {
    await this.#client.disconnect()
  }

  async reconnect(onDisconnect: () => void): Promise<Account[]> {
    try {
      const accounts = await this.#client.reconnectSession()
      this.#client.connector?.on('disconnect', onDisconnect)

      if (accounts.length === 0) {
        throw new Error('No accounts found!')
      }

      this.accounts = accounts.map((address: string, idx: number) => ({
        name: `Pera Wallet ${idx + 1}`,
        address
      }))

      return this.accounts
    } catch (error: any) {
      console.error(error)
      onDisconnect()
      return []
    }
  }

  async transactionSigner(
    txnGroup: Transaction[] | Uint8Array[] | Uint8Array[][],
    indexesToSign?: number[],
    returnGroup = true
  ): Promise<Uint8Array[]> {
    if (!txnGroup[0]) {
      throw new Error('Empty transaction group!')
    }
    const txnsToSign: SignerTransaction[] = []
    const signedIndexes: number[] = []
    const connectedAccounts = this.accounts.map((account: Account) => account.address)

    const isTransactionType = isDecodedTransaction(txnGroup[0])

    if (isTransactionType) {
      const transactionGroup = txnGroup as Transaction[]

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

      const signerResult = await this.#client.signTransaction([txnsToSign])
      return signerResult
    } else {
      const uintTxnGroup = txnGroup.flat() as Uint8Array[]

      const encodedTxnObjects = uintTxnGroup.map((txn) => {
        return algosdk.decodeObj(txn)
      }) as Array<EncodedTransaction | EncodedSignedTransaction>

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

      const result = await this.#client.signTransaction([txnsToSign])

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
