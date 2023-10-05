import { PeraWalletConnect } from '@perawallet/connect'
import algosdk from 'algosdk'
import { BaseWallet } from './base'
import { WALLET_ID } from 'src/constants'
import { Store } from 'src/store'
import { isTransaction, isSignedTxnObject, compareAccountsMatch } from 'src/utils'
import { StoreActions, type State } from 'src/types/state'
import type { EncodedSignedTransaction, EncodedTransaction, Transaction } from 'algosdk'
import type { PeraWalletConnectOptions } from 'src/types/wallets/pera'
import type { SignerTransaction } from 'src/types/transaction'
import type { WalletAccount, WalletConstructor } from 'src/types/wallet'

export class PeraWallet extends BaseWallet {
  private client: PeraWalletConnect | null = null
  private options: PeraWalletConnectOptions

  protected store: Store<State>
  protected notifySubscribers: () => void

  public subscribe: (callback: (state: State) => void) => () => void

  constructor({
    id,
    store,
    subscribe,
    onStateChange,
    options = {}
  }: WalletConstructor<WALLET_ID.PERA>) {
    super({ id, store, subscribe, onStateChange })
    this.options = options
    this.store = store
    this.subscribe = subscribe
    this.notifySubscribers = onStateChange
  }

  private initializeClient = async (): Promise<PeraWalletConnect> => {
    console.info('[PeraWallet] Initializing client...')
    const client = new PeraWalletConnect(this.options)
    this.client = client
    return client
  }

  public connect = async (): Promise<WalletAccount[]> => {
    console.info('[PeraWallet] Connecting...')
    try {
      const client = this.client || (await this.initializeClient())

      const accounts = await client.connect()
      client.connector?.on('disconnect', this.handleDisconnect)

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
        console.error(error)
      }
      return []
    }
  }

  public disconnect = async (): Promise<void> => {
    console.info('[PeraWallet] Disconnecting...')
    try {
      await this.client?.disconnect()
      this.handleDisconnect()
    } catch (error: any) {
      console.error(error)
    }
  }

  public resumeSession = async (): Promise<void> => {
    try {
      const state = this.store.getState()
      const walletState = state.wallets.get(this.id)

      if (!walletState) {
        // No persisted state, abort
        return
      }
      console.info('[PeraWallet] Resuming session...')

      const client = this.client || (await this.initializeClient())

      const accounts = await client.reconnectSession()
      client.connector?.on('disconnect', this.handleDisconnect)

      if (accounts.length === 0) {
        throw new Error('No accounts found!')
      }

      const walletAccounts = accounts.map((address: string, idx: number) => ({
        name: `Pera Wallet ${idx + 1}`,
        address
      }))

      const match = compareAccountsMatch(walletAccounts, walletState.accounts)

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
