import algosdk from 'algosdk'
import { BaseWallet } from './base'
import { WALLET_ID } from 'src/constants'
import { Store } from 'src/store'
import {
  isSignedTxnObject,
  mergeSignedTxnsWithGroup,
  normalizeTxnGroup,
  shouldSignTxnObject
} from 'src/utils'
import { StoreActions, type State } from 'src/types/state'
import type { EncodedSignedTransaction, EncodedTransaction } from 'algosdk'
import type { WalletTransaction } from 'src/types/transaction'
import type { Exodus, ExodusOptions, WindowExtended } from 'src/types/wallets/exodus'
import type { WalletAccount, WalletConstructor } from 'src/types/wallet'

export class ExodusWallet extends BaseWallet {
  private client: Exodus | null = null
  private options: ExodusOptions

  protected store: Store<State>
  protected notifySubscribers: () => void

  constructor({
    id,
    store,
    subscribe,
    onStateChange,
    options = {}
  }: WalletConstructor<WALLET_ID.EXODUS>) {
    super({ id, store, subscribe, onStateChange })
    this.options = options
    this.store = store
    this.notifySubscribers = onStateChange
  }

  private initializeClient = async (): Promise<Exodus> => {
    console.info('[ExodusWallet] Initializing client...')
    if (typeof window == 'undefined' || (window as WindowExtended).algorand === undefined) {
      throw new Error('Exodus is not available.')
    }
    const client = (window as WindowExtended).algorand
    this.client = client
    return client
  }

  public connect = async (): Promise<WalletAccount[]> => {
    try {
      const client = this.client || (await this.initializeClient())
      const { accounts } = await client.enable(this.options)

      if (accounts.length === 0) {
        throw new Error('[ExodusWallet] No accounts found!')
      }

      const walletAccounts = accounts.map((address: string, idx: number) => ({
        name: `Exodus Wallet ${idx + 1}`,
        address
      }))

      const activeAccount = walletAccounts[0]!

      this.store.dispatch(StoreActions.ADD_WALLET, {
        walletId: this.id,
        wallet: {
          accounts: walletAccounts,
          activeAccount
        }
      })

      this.notifySubscribers()

      return walletAccounts
    } catch (error: any) {
      console.error(error)
      return []
    }
  }

  public disconnect = async (): Promise<void> => {
    console.info('[ExodusWallet] Disconnecting...')
    this.onDisconnect()
  }

  public resumeSession = async (): Promise<void> => {
    const state = this.store.getState()
    const walletState = state.wallets.get(this.id)

    if (!walletState) {
      // No persisted state, abort
      return
    }
    console.info('[ExodusWallet] Resuming session...')

    if (
      window === undefined ||
      (window as WindowExtended).algorand === undefined ||
      (window as WindowExtended).algorand.isConnected !== true
    ) {
      this.onDisconnect()
    }
  }

  public signTransactions = async (
    txnGroup: algosdk.Transaction[] | algosdk.Transaction[][] | Uint8Array[] | Uint8Array[][],
    indexesToSign?: number[],
    returnGroup = true
  ): Promise<Uint8Array[]> => {
    if (!this.client) {
      throw new Error('[ExodusWallet] Client not initialized!')
    }
    const txnsToSign: WalletTransaction[] = []
    const signedIndexes: number[] = []

    const msgpackTxnGroup: Uint8Array[] = normalizeTxnGroup(txnGroup)

    // Decode transactions to access properties
    const decodedObjects = msgpackTxnGroup.map((txn) => {
      return algosdk.decodeObj(txn)
    }) as Array<EncodedTransaction | EncodedSignedTransaction>

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

  public transactionSigner = async (
    txnGroup: algosdk.Transaction[],
    indexesToSign: number[]
  ): Promise<Uint8Array[]> => {
    if (!this.client) {
      throw new Error('[ExodusWallet] Client not initialized!')
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
}
