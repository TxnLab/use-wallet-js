import algosdk from 'algosdk'
import { BaseWallet } from './base'
import { WALLET_ID, getWalletIcon } from 'src/constants'
import { Store } from 'src/store'
import {
  compareAccounts,
  isSignedTxnObject,
  mergeSignedTxnsWithGroup,
  normalizeTxnGroup,
  shouldSignTxnObject
} from 'src/utils'
import { StoreActions, type State } from 'src/types/state'
import type { PeraWalletConnect } from '@perawallet/connect'
import type { EncodedSignedTransaction, EncodedTransaction } from 'algosdk'
import type { SignerTransaction } from 'src/types/transaction'
import type { WalletAccount, WalletConstructor } from 'src/types/wallet'
import type { PeraWalletConnectOptions } from 'src/types/wallets/pera'

export class PeraWallet extends BaseWallet {
  private client: PeraWalletConnect | null = null
  private options: PeraWalletConnectOptions

  protected store: Store<State>
  protected notifySubscribers: () => void

  constructor({
    id,
    store,
    subscribe,
    onStateChange,
    options = {},
    metadata = {}
  }: WalletConstructor<WALLET_ID.PERA>) {
    super({ id, metadata, store, subscribe, onStateChange })
    this.options = options
    this.store = store
    this.notifySubscribers = onStateChange
  }

  static defaultMetadata = {
    name: 'Pera',
    icon: getWalletIcon(WALLET_ID.PERA)
  }

  private initializeClient = async (): Promise<PeraWalletConnect> => {
    console.info('[PeraWallet] Initializing client...')
    const PeraWalletConnect = (await import('@perawallet/connect')).default.PeraWalletConnect
    const client = new PeraWalletConnect(this.options)
    client.connector?.on('disconnect', this.onDisconnect)
    this.client = client
    return client
  }

  public connect = async (): Promise<WalletAccount[]> => {
    console.info('[PeraWallet] Connecting...')
    try {
      const client = this.client || (await this.initializeClient())
      const accounts = await client.connect()

      if (accounts.length === 0) {
        throw new Error('No accounts found!')
      }

      const walletAccounts = accounts.map((address: string, idx: number) => ({
        name: `Pera Wallet ${idx + 1}`,
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
      if (error?.data?.type !== 'CONNECT_MODAL_CLOSED') {
        console.error('[PeraWallet] Error connecting:', error)
      } else {
        console.info('[PeraWallet] Connection cancelled.')
      }
      return []
    }
  }

  public disconnect = async (): Promise<void> => {
    console.info('[PeraWallet] Disconnecting...')
    try {
      await this.client?.disconnect()
      this.onDisconnect()
    } catch (error: any) {
      console.error(error)
    }
  }

  public resumeSession = async (): Promise<void> => {
    try {
      const state = this.store.getState()
      const walletState = state.wallets.get(this.id)

      // No session to resume
      if (!walletState) {
        return
      }

      console.info('[PeraWallet] Resuming session...')

      const client = this.client || (await this.initializeClient())
      const accounts = await client.reconnectSession()

      if (accounts.length === 0) {
        throw new Error('[PeraWallet] No accounts found!')
      }

      const walletAccounts = accounts.map((address: string, idx: number) => ({
        name: `Pera Wallet ${idx + 1}`,
        address
      }))

      const match = compareAccounts(walletAccounts, walletState.accounts)

      if (!match) {
        console.warn(`[PeraWallet] Session accounts mismatch, updating accounts`)
        this.store.dispatch(StoreActions.SET_ACCOUNTS, {
          walletId: this.id,
          accounts: walletAccounts
        })

        this.notifySubscribers()
      }
    } catch (error: any) {
      console.error(error)
      this.onDisconnect()
    }
  }

  public signTransactions = async (
    txnGroup: algosdk.Transaction[] | algosdk.Transaction[][] | Uint8Array[] | Uint8Array[][],
    indexesToSign?: number[],
    returnGroup = true
  ): Promise<Uint8Array[]> => {
    if (!this.client) {
      throw new Error('[PeraWallet] Client not initialized!')
    }
    const txnsToSign: SignerTransaction[] = []
    const signedIndexes: number[] = []

    const msgpackTxnGroup: Uint8Array[] = normalizeTxnGroup(txnGroup)

    // Decode transactions to access properties
    const decodedObjects = msgpackTxnGroup.map((txn) => {
      return algosdk.decodeObj(txn)
    }) as Array<EncodedTransaction | EncodedSignedTransaction>

    // Marshal transactions into `SignerTransaction[]`
    decodedObjects.forEach((txnObject, idx) => {
      const isSigned = isSignedTxnObject(txnObject)
      const shouldSign = shouldSignTxnObject(txnObject, this.addresses, indexesToSign, idx)

      const txnBuffer: Uint8Array = msgpackTxnGroup[idx]!
      const txn: algosdk.Transaction = isSigned
        ? algosdk.decodeSignedTransaction(txnBuffer).txn
        : algosdk.decodeUnsignedTransaction(txnBuffer)

      if (shouldSign) {
        txnsToSign.push({ txn })
        signedIndexes.push(idx)
      } else {
        txnsToSign.push({ txn, signers: [] })
      }
    })

    // Sign transactions
    const signedTxns = await this.client.signTransaction([txnsToSign])

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
      throw new Error('[PeraWallet] Client not initialized!')
    }

    const txnsToSign = txnGroup.reduce<SignerTransaction[]>((acc, txn, idx) => {
      if (indexesToSign.includes(idx)) {
        acc.push({ txn })
      } else {
        acc.push({ txn, signers: [] })
      }
      return acc
    }, [])

    const signTxnsResult = await this.client.signTransaction([txnsToSign])
    return signTxnsResult
  }
}
