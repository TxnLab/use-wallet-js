import { getAppMetadata, getSdkError } from '@walletconnect/utils'
import algosdk from 'algosdk'
import { NetworkId, caipChainId } from 'src/network'
import { Store, StoreActions, type State } from 'src/store'
import { BaseWallet } from '../base'
import { WalletId } from './constants'
import {
  compareAccounts,
  formatJsonRpcRequest,
  isSignedTxnObject,
  mergeSignedTxnsWithGroup,
  normalizeTxnGroup,
  shouldSignTxnObject
} from '../utils'
import type { WalletConnectModal, WalletConnectModalConfig } from '@walletconnect/modal'
import type SignClient from '@walletconnect/sign-client'
import type { SessionTypes, SignClientTypes } from '@walletconnect/types'
import type { WalletAccount, WalletConstructor, WalletTransaction } from '../types'

interface SignClientOptions {
  projectId: string
  relayUrl?: string
  metadata?: SignClientTypes.Metadata
}

type WalletConnectModalOptions = Pick<
  WalletConnectModalConfig,
  | 'enableExplorer'
  | 'explorerRecommendedWalletIds'
  | 'privacyPolicyUrl'
  | 'termsOfServiceUrl'
  | 'themeMode'
  | 'themeVariables'
>

export type WalletConnectOptions = SignClientOptions & WalletConnectModalOptions

const icon =
  'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIKCSB2aWV3Qm94PSIwIDAgNDgwIDQ4MCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDgwIDQ4MDsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsOiMzMzk2RkY7fQo8L3N0eWxlPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMTI2LjYsMTY4YzYyLjYtNjEuMywxNjQuMi02MS4zLDIyNi44LDBsNy41LDcuNGMzLjEsMy4xLDMuMSw4LDAsMTEuMWwtMjUuOCwyNS4yYy0xLjYsMS41LTQuMSwxLjUtNS43LDAKCWwtMTAuNC0xMC4yYy00My43LTQyLjgtMTE0LjUtNDIuOC0xNTguMiwwbC0xMS4xLDEwLjljLTEuNiwxLjUtNC4xLDEuNS01LjcsMGwtMjUuOC0yNS4yYy0zLjEtMy4xLTMuMS04LDAtMTEuMUwxMjYuNiwxNjh6CgkgTTQwNi43LDIyMC4ybDIyLjksMjIuNWMzLjEsMy4xLDMuMSw4LDAsMTEuMUwzMjYuMiwzNTUuMWMtMy4xLDMuMS04LjIsMy4xLTExLjMsMGwtNzMuNC03MS45Yy0wLjgtMC44LTIuMS0wLjgtMi44LDBsLTczLjQsNzEuOQoJYy0zLjEsMy4xLTguMiwzLjEtMTEuMywwTDUwLjMsMjUzLjhjLTMuMS0zLjEtMy4xLTgsMC0xMS4xbDIyLjktMjIuNWMzLjEtMy4xLDguMi0zLjEsMTEuMywwbDczLjQsNzEuOWMwLjgsMC44LDIuMSwwLjgsMi44LDAKCWw3My40LTcxLjljMy4xLTMuMSw4LjItMy4xLDExLjMsMGw3My40LDcxLjljMC44LDAuOCwyLjEsMC44LDIuOCwwbDczLjQtNzEuOUMzOTguNSwyMTcuMSw0MDMuNiwyMTcuMSw0MDYuNywyMjAuMkw0MDYuNywyMjAuMnoiLz4KPC9zdmc+Cg=='

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
    options,
    metadata = {}
  }: WalletConstructor<WalletId.WALLETCONNECT>) {
    super({ id, metadata, store, subscribe, onStateChange })
    if (!options) {
      throw new Error('[WalletConnect] Options are required.')
    }
    const {
      projectId,
      relayUrl = 'wss://relay.walletconnect.com',
      metadata: _metadata = getAppMetadata(),
      ...modalOptions
    } = options

    this.options = {
      projectId,
      relayUrl,
      ..._metadata
    }

    this.modalOptions = modalOptions
    this.chains = Object.values(caipChainId)
    this.store = store
    this.notifySubscribers = onStateChange
  }

  static defaultMetadata = { name: 'WalletConnect', icon }

  private async initializeClient(): Promise<SignClient> {
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

  private async initializeModal(): Promise<WalletConnectModal> {
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

  private onSessionConnected(session: SessionTypes.Struct): WalletAccount[] {
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

  public async connect(): Promise<WalletAccount[]> {
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

  public async disconnect(): Promise<void> {
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

  public async resumeSession(): Promise<void> {
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

  public async signTransactions(
    txnGroup: algosdk.Transaction[] | algosdk.Transaction[][] | Uint8Array[] | Uint8Array[][],
    indexesToSign?: number[],
    returnGroup = true
  ): Promise<Uint8Array[]> {
    if (!this.client) {
      throw new Error('[WalletConnect] Client not initialized!')
    }
    if (!this.session) {
      throw new Error('[WalletConnect] Session is not connected')
    }
    if (this.activeNetwork === NetworkId.LOCALNET) {
      throw new Error(`[WalletConnect] Invalid network: ${this.activeNetwork}`)
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

    // Format JSON-RPC request
    const request = formatJsonRpcRequest('algo_signTxn', [txnsToSign])

    // Sign transactions
    const signTxnsResult = await this.client.request<Array<string | null>>({
      chainId: caipChainId[this.activeNetwork]!,
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

  public async transactionSigner(
    txnGroup: algosdk.Transaction[],
    indexesToSign: number[]
  ): Promise<Uint8Array[]> {
    if (!this.client) {
      throw new Error('[WalletConnect] Client not initialized!')
    }
    if (!this.session) {
      throw new Error('[WalletConnect] Session is not connected')
    }
    if (this.activeNetwork === NetworkId.LOCALNET) {
      throw new Error(`[WalletConnect] Invalid network: ${this.activeNetwork}`)
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
      chainId: caipChainId[this.activeNetwork]!,
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
