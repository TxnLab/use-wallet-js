import algosdk from 'algosdk'
import { Store, StoreActions, type State } from 'src/store'
import { BaseWallet } from '../base'
import { WalletId } from './constants'
import {
  isSignedTxnObject,
  mergeSignedTxnsWithGroup,
  normalizeTxnGroup,
  shouldSignTxnObject
} from '../utils'
import type MyAlgoConnect from '@randlabs/myalgo-connect'
import type { WalletAccount, WalletConstructor, WalletTransaction } from '../types'

export interface MyAlgoConnectOptions {
  timeout?: number
  bridgeUrl?: string
  disableLedgerNano?: boolean
}

const icon =
  'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMzIgMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogIDxjaXJjbGUgZmlsbD0iIzI0NUVDNiIgY3g9IjE2IiBjeT0iMTYiIHI9IjE2Ii8+CiAgPHBvbHlnb24gZmlsbD0iI0ZGRkZGRiIgcG9pbnRzPSIxMi40LDIxLjIgMTQuNSwyMS4yIDE1LjMsMTkuOSAxNi42LDE3LjYgMTguMSwxNC45IDE5LjksMTEuNyAyMC4yLDExLjIgMjAuMywxMS43IDIyLjksMjEuMiAyNSwyMS4yIDIxLjUsOC45IDIxLjQsOC42IDE5LjUsOC42IDE5LjUsOC43IDE3LjgsMTEuOCAxNiwxNC45IDE1LjgsMTQuMSAxNS4yLDExLjcgMTUuMSwxMS41IDE0LjQsOC45IDE0LjMsOC42IDEyLjQsOC42IDEyLjQsOC43IDEwLjcsMTEuOCA4LjksMTUgNy4xLDE4IDUuMywyMS4yIDcuNCwyMS4yIDkuMiwxOCAxMSwxNC44IDEyLjgsMTEuNiAxMy4xLDExLjEgMTMuMiwxMS42IDEzLjcsMTMuNyAxNC40LDE2LjMgMTQuNiwxNy4yIDE0LjIsMTgiLz4KPC9zdmc+'

export class MyAlgoWallet extends BaseWallet {
  private client: MyAlgoConnect | null = null
  private options: MyAlgoConnectOptions

  protected store: Store<State>
  protected notifySubscribers: () => void

  constructor({
    id,
    store,
    subscribe,
    onStateChange,
    options = {},
    metadata = {}
  }: WalletConstructor<WalletId.MYALGO>) {
    super({ id, metadata, store, subscribe, onStateChange })
    this.options = options
    this.store = store
    this.notifySubscribers = onStateChange
  }

  static defaultMetadata = { name: 'MyAlgo', icon }

  private initializeClient = async (): Promise<MyAlgoConnect> => {
    console.info('[MyAlgoWallet] Initializing client...')
    const MyAlgoConnect = (await import('@randlabs/myalgo-connect')).default
    const client = new MyAlgoConnect(this.options)
    this.client = client
    return client
  }

  public connect = async (): Promise<WalletAccount[]> => {
    console.info('[MyAlgoWallet] Connecting...')
    try {
      const client = this.client || (await this.initializeClient())
      const accounts: WalletAccount[] = await client.connect()

      if (accounts.length === 0) {
        throw new Error('No accounts found!')
      }

      const activeAccount = accounts[0]!

      this.store.dispatch(StoreActions.ADD_WALLET, {
        walletId: this.id,
        wallet: {
          accounts,
          activeAccount
        }
      })

      this.notifySubscribers()

      return accounts
    } catch (error: any) {
      if (!error.message.includes('Operation cancelled')) {
        console.error('[MyAlgoWallet] Error connecting:', error)
      } else {
        console.info('[MyAlgoWallet] Connection cancelled.')
      }
      return []
    }
  }

  public disconnect = async (): Promise<void> => {
    console.info('[MyAlgoWallet] Disconnecting...')
    this.onDisconnect()
  }

  public resumeSession = (): Promise<void> => {
    return Promise.resolve()
  }

  public transactionSigner = async (
    txnGroup: algosdk.Transaction[],
    indexesToSign: number[]
  ): Promise<Uint8Array[]> => {
    if (!this.client) {
      throw new Error('[MyAlgoWallet] Client not initialized!')
    }

    const txnsToSign = txnGroup.reduce<WalletTransaction[]>((acc, txn, idx) => {
      const txnBase64 = Buffer.from(txn.toByte()).toString('base64')

      if (indexesToSign.includes(idx)) {
        acc.push({ txn: txnBase64 })
      } else {
        acc.push({ txn: txnBase64, signers: [] })
      }
      return acc
    }, [])

    const signTxnsResult = await this.client.signTxns(txnsToSign)
    const signedTxnsBase64 = signTxnsResult.filter(Boolean) as string[]

    const signedTxns = signedTxnsBase64.map((txn) => new Uint8Array(Buffer.from(txn, 'base64')))
    return signedTxns
  }

  public signTransactions = async (
    txnGroup: algosdk.Transaction[] | algosdk.Transaction[][] | Uint8Array[] | Uint8Array[][],
    indexesToSign?: number[],
    returnGroup = true
  ): Promise<Uint8Array[]> => {
    if (!this.client) {
      throw new Error('[MyAlgoWallet] Client not initialized!')
    }
    const txnsToSign: WalletTransaction[] = []
    const signedIndexes: number[] = []

    const msgpackTxnGroup: Uint8Array[] = normalizeTxnGroup(txnGroup)

    // Decode transactions to access properties
    const decodedObjects = msgpackTxnGroup.map((txn) => {
      return algosdk.decodeObj(txn)
    }) as Array<algosdk.EncodedTransaction | algosdk.EncodedSignedTransaction>

    // Marshal transactions into `WalletTransaction[]`
    decodedObjects.forEach((txnObject, idx) => {
      const isSigned = isSignedTxnObject(txnObject)
      const shouldSign = shouldSignTxnObject(txnObject, this.addresses, indexesToSign, idx)

      const txnBuffer: Uint8Array = msgpackTxnGroup[idx]!
      const txn: algosdk.Transaction = isSigned
        ? algosdk.decodeSignedTransaction(txnBuffer).txn
        : algosdk.decodeUnsignedTransaction(txnBuffer)

      const txnBase64 = Buffer.from(txn.toByte()).toString('base64')

      if (shouldSign) {
        txnsToSign.push({ txn: txnBase64 })
        signedIndexes.push(idx)
      } else {
        txnsToSign.push({ txn: txnBase64, signers: [] })
      }
    })

    // Sign transactions
    const signTxnsResult = await this.client.signTxns(txnsToSign)

    // Filter out null results
    const signedTxnsBase64 = signTxnsResult.filter(Boolean) as string[]

    // Convert base64 signed transactions to msgpack
    const signedTxns = signedTxnsBase64.map((txn) => new Uint8Array(Buffer.from(txn, 'base64')))

    // Merge signed transactions back into original group
    const txnGroupSigned = mergeSignedTxnsWithGroup(
      signedTxns,
      msgpackTxnGroup,
      signedIndexes,
      returnGroup
    )

    return txnGroupSigned
  }
}
