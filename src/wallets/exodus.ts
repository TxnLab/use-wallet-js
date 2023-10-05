import algosdk from 'algosdk'
import { BaseWallet } from './base'
import { WALLET_ID } from 'src/constants'
import { Store } from 'src/store'
import { isTransaction, isSignedTxnObject } from 'src/utils'
import { StoreActions, type State } from 'src/types/state'
import type { EncodedSignedTransaction, EncodedTransaction, Transaction } from 'algosdk'
import type { Exodus, ExodusOptions, WindowExtended } from 'src/types/wallets/exodus'
import type { WalletAccount, WalletConstructor } from 'src/types/wallet'

export class ExodusWallet extends BaseWallet {
  private client: Exodus | null = null
  private options: ExodusOptions

  protected store: Store<State>
  protected notifySubscribers: () => void

  public subscribe: (callback: (state: State) => void) => () => void

  constructor({
    id,
    store,
    subscribe,
    onStateChange,
    options
  }: WalletConstructor<WALLET_ID.EXODUS>) {
    super({ id, store, subscribe, onStateChange })
    this.options = options || { onlyIfTrusted: false }
    this.store = store
    this.subscribe = subscribe
    this.notifySubscribers = onStateChange
  }

  private initializeClient = async (): Promise<Exodus> => {
    console.info('[ExodusWallet] Initializing client...')
    if (typeof window == 'undefined' || (window as WindowExtended).exodus === undefined) {
      throw new Error('Exodus is not available.')
    }
    const client = (window as WindowExtended).exodus.algorand
    this.client = client
    return client
  }

  public connect = async (): Promise<WalletAccount[]> => {
    try {
      const client = this.client || (await this.initializeClient())
      const { address } = await client.connect(this.options)

      if (!address) {
        throw new Error('No accounts found!')
      }

      const walletAccounts = [
        {
          name: `Exodus 1`,
          address
        }
      ]

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
    this.handleDisconnect()
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
      (window as WindowExtended).exodus === undefined ||
      (window as WindowExtended).exodus.algorand.isConnected !== true
    ) {
      this.handleDisconnect()
    }
  }

  public transactionSigner = async (
    connectedAccounts: string[],
    txnGroup: Transaction[] | Uint8Array[] | Uint8Array[][],
    indexesToSign?: number[],
    returnGroup = true
  ): Promise<Uint8Array[]> => {
    if (!this.client) {
      throw new Error('Client not initialized!')
    }
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
