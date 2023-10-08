import { getAppMetadata, getSdkError } from '@walletconnect/utils'
import algosdk from 'algosdk'
import { BaseWallet } from './base'
import { ALGORAND_CHAINS_CAIP2, WALLET_ID } from 'src/constants'
import { Store } from 'src/store'
import {
  compareAccounts,
  formatJsonRpcRequest,
  isSignedTxnObject,
  mergeSignedTxnsWithGroup,
  normalizeTxnGroup,
  shouldSignTxnObject
} from 'src/utils'
import { StoreActions, type State } from 'src/types/state'
import type { WalletConnectModal } from '@walletconnect/modal'
import type SignClient from '@walletconnect/sign-client'
import type { SessionTypes } from '@walletconnect/types'
import type { EncodedSignedTransaction, EncodedTransaction } from 'algosdk'
import type { WalletTransaction } from 'src/types/transaction'
import type { WalletAccount, WalletConstructor } from 'src/types/wallet'
import type { SignClientOptions, WalletConnectModalOptions } from 'src/types/wallets/walletconnect'

export class WalletConnect extends BaseWallet {
  private client: SignClient | null = null
  private options: SignClientOptions
  private modal: WalletConnectModal | null = null
  private modalOptions: WalletConnectModalOptions
  private session: SessionTypes.Struct | null = null
  private chains: string[]

  protected store: Store<State>
  protected notifySubscribers: () => void

  constructor({
    id,
    store,
    subscribe,
    onStateChange,
    options
  }: WalletConstructor<WALLET_ID.WALLETCONNECT>) {
    super({ id, store, subscribe, onStateChange })
    if (!options) {
      throw new Error('[WalletConnect] Options are required.')
    }
    const {
      projectId,
      relayUrl = 'wss://relay.walletconnect.com',
      metadata = getAppMetadata(),
      ...modalOptions
    } = options

    this.options = {
      projectId,
      relayUrl,
      ...metadata
    }

    this.modalOptions = modalOptions
    this.chains = Array.from(ALGORAND_CHAINS_CAIP2.values())
    this.store = store
    this.notifySubscribers = onStateChange
  }

  private initializeClient = async (): Promise<SignClient> => {
    console.info('[WalletConnect] Initializing client...')
    const SignClient = (await import('@walletconnect/sign-client')).SignClient
    const client = await SignClient.init(this.options)

    client.on('session_event', (args) => {
      console.log('[WalletConnect] EVENT', 'session_event', args)
    })

    client.on('session_update', ({ topic, params }) => {
      console.log('[WalletConnect] EVENT', 'session_update', { topic, params })
      const { namespaces } = params
      const session = client.session.get(topic)
      const updatedSession = { ...session, namespaces }
      this.onSessionConnected(updatedSession)
    })

    client.on('session_delete', () => {
      console.log('[WalletConnect] EVENT', 'session_delete')
      this.session = null
    })

    this.client = client
    return client
  }

  private initializeModal = async (): Promise<WalletConnectModal> => {
    console.info('[WalletConnect] Initializing modal...')
    const WalletConnectModal = (await import('@walletconnect/modal')).WalletConnectModal
    const modal = new WalletConnectModal({
      projectId: this.options.projectId,
      chains: this.chains,
      ...this.modalOptions
    })

    modal.subscribeModal((state) =>
      console.info(`[WalletConnect] Modal ${state.open ? 'open' : 'closed'}`)
    )

    this.modal = modal
    return modal
  }

  private onSessionConnected = (session: SessionTypes.Struct): WalletAccount[] => {
    const caipAccounts = session.namespaces.algorand!.accounts

    // @todo: Validate format of CAIP-10 accounts

    // Filter duplicate accounts (same address, different chain)
    const accounts = [...new Set(caipAccounts.map((account) => account.split(':').pop()!))]

    const walletAccounts = accounts.map((address: string, idx: number) => ({
      name: `WalletConnect ${idx + 1}`,
      address
    }))

    const state = this.store.getState()
    const walletState = state.wallets.get(this.id)

    if (!walletState) {
      this.store.dispatch(StoreActions.ADD_WALLET, {
        walletId: this.id,
        wallet: {
          accounts: walletAccounts,
          activeAccount: walletAccounts[0]!
        }
      })

      this.notifySubscribers()
    } else {
      const match = compareAccounts(walletAccounts, walletState.accounts)

      if (!match) {
        console.warn(`[WalletConnect] Updating accounts`)
        this.store.dispatch(StoreActions.SET_ACCOUNTS, {
          walletId: this.id,
          accounts: walletAccounts
        })

        this.notifySubscribers()
      }
    }

    this.session = session
    return walletAccounts
  }

  public connect = async (): Promise<WalletAccount[]> => {
    console.info('[WalletConnect] Connecting...')
    try {
      const client = this.client || (await this.initializeClient())
      const modal = this.modal || (await this.initializeModal())

      const requiredNamespaces = {
        algorand: {
          chains: this.chains,
          methods: ['algo_signTxn'],
          events: []
        }
      }

      const { uri, approval } = await client.connect({ requiredNamespaces })

      if (!uri) {
        throw new Error('No URI found')
      }

      await modal.openModal({ uri })

      const session = await approval()
      const walletAccounts = this.onSessionConnected(session)

      return walletAccounts
    } catch (error: any) {
      console.error('[WalletConnect] Error connecting:', error)
      return []
    } finally {
      this.modal?.closeModal()
    }
  }

  public disconnect = async (): Promise<void> => {
    console.info('[WalletConnect] Disconnecting...')
    if (!this.client) {
      throw new Error('[WalletConnect] Client not initialized')
    }
    if (!this.session) {
      throw new Error('[WalletConnect] Session is not connected')
    }
    try {
      await this.client.disconnect({
        topic: this.session.topic,
        reason: getSdkError('USER_DISCONNECTED')
      })
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

      console.info('[WalletConnect] Resuming session...')

      const client = this.client || (await this.initializeClient())

      if (client.session.length) {
        const lastKeyIndex = client.session.keys.length - 1
        const restoredSession = client.session.get(client.session.keys[lastKeyIndex]!)
        this.onSessionConnected(restoredSession)
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
      throw new Error('[WalletConnect] Client not initialized!')
    }
    if (!this.session) {
      throw new Error('[WalletConnect] Session is not connected')
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

    // Format JSON-RPC request
    const request = formatJsonRpcRequest('algo_signTxn', [txnsToSign])

    // Sign transactions
    const signTxnsResult = await this.client.request<Array<string | null>>({
      chainId: ALGORAND_CHAINS_CAIP2.get('mainnet')!, // @todo: Get active chain
      topic: this.session.topic,
      request
    })

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
      throw new Error('[WalletConnect] Client not initialized!')
    }
    if (!this.session) {
      throw new Error('[WalletConnect] Session is not connected')
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

    // Format JSON-RPC request
    const request = formatJsonRpcRequest('algo_signTxn', [txnsToSign])

    // Sign transactions
    const signTxnsResult = await this.client.request<Array<string | null>>({
      chainId: ALGORAND_CHAINS_CAIP2.get('mainnet')!, // @todo: Get active chain
      topic: this.session.topic,
      request
    })

    // Filter out null results
    const signedTxnsBase64 = signTxnsResult.filter(Boolean) as string[]

    // Convert base64 signed transactions to msgpack
    const signedTxns = signedTxnsBase64.map((txn) => new Uint8Array(Buffer.from(txn, 'base64')))

    return signedTxns
  }
}
