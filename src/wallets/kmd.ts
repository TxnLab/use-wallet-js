import algosdk from 'algosdk'
import { BaseWallet } from './base'
import { WalletId, getWalletIcon } from 'src/constants'
import { StoreActions, type State, type Store } from 'src/store'
import {
  isSignedTxnObject,
  mergeSignedTxnsWithGroup,
  normalizeTxnGroup,
  shouldSignTxnObject
} from 'src/utils'
import type {
  CustomTokenHeader,
  EncodedSignedTransaction,
  EncodedTransaction,
  KMDTokenHeader
} from 'algosdk'
import type { WalletAccount, WalletConstructor } from 'src/types/wallet'

interface KmdConstructor {
  token: string | KMDTokenHeader | CustomTokenHeader
  baseServer?: string
  port?: string | number
  headers?: Record<string, string>
}

export type KmdOptions = Partial<Pick<KmdConstructor, 'token'>> &
  Omit<KmdConstructor, 'token'> & {
    wallet: string
  }

interface KmdWalletRecord {
  id: string
  name: string
  driver_name?: string
  driver_version?: number
  mnemonic_ux?: boolean
  supported_txs?: Array<any>
}

interface ListWalletsResponse {
  wallets: KmdWalletRecord[]
  message?: string
  error?: boolean
}

interface InitWalletHandleResponse {
  wallet_handle_token: string
  message?: string
  error?: boolean
}

interface ListKeysResponse {
  addresses: string[]
  message?: string
  error?: boolean
}

export class KmdWallet extends BaseWallet {
  private client: algosdk.Kmd | null = null
  private options: KmdConstructor
  private walletName: string
  private walletId: string = ''
  private password: string = ''

  protected store: Store<State>
  protected notifySubscribers: () => void

  constructor({
    id,
    store,
    subscribe,
    onStateChange,
    options,
    metadata = {}
  }: WalletConstructor<WalletId.KMD>) {
    super({ id, metadata, store, subscribe, onStateChange })

    const {
      token = 'a'.repeat(64),
      baseServer = 'http://127.0.0.1',
      port = 7833,
      wallet = 'unencrypted-default-wallet'
    } = options || {}

    this.options = { token, baseServer, port }
    this.walletName = wallet

    this.store = store
    this.notifySubscribers = onStateChange
  }

  static defaultMetadata = {
    name: 'KMD',
    icon: getWalletIcon(WalletId.KMD)
  }

  private initializeClient = async (): Promise<algosdk.Kmd> => {
    console.info('[KmdWallet] Initializing client...')
    const { token, baseServer, port } = this.options
    const client = new algosdk.Kmd(token, baseServer, port)
    this.client = client
    return client
  }

  public connect = async (): Promise<WalletAccount[]> => {
    console.info('[KmdWallet] Connecting...')
    try {
      if (!this.client) {
        await this.initializeClient()
      }

      // Get a new token
      const walletId = this.walletId || (await this.fetchWalletId())
      const token = await this.fetchToken(walletId, this.getPassword())

      const accounts = await this.fetchAccounts(token)

      if (accounts.length === 0) {
        throw new Error('No accounts found!')
      }

      const walletAccounts = accounts.map((address: string, idx: number) => ({
        name: `KMD Wallet ${idx + 1}`,
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

      await this.releaseToken(token)

      return walletAccounts
    } catch (error) {
      console.error('[KmdWallet] Error connecting:', error)
      return []
    }
  }

  public disconnect = async (): Promise<void> => {
    console.info('[KmdWallet] Disconnecting...')
    this.onDisconnect()
  }

  public resumeSession = (): Promise<void> => {
    return Promise.resolve()
  }

  public signTransactions = async (
    txnGroup: algosdk.Transaction[] | algosdk.Transaction[][] | Uint8Array[] | Uint8Array[][],
    indexesToSign?: number[],
    returnGroup = true
  ): Promise<Uint8Array[]> => {
    if (!this.client) {
      throw new Error('[KmdWallet] Client not initialized!')
    }
    // Get a new token
    const walletId = this.walletId || (await this.fetchWalletId())
    const password = this.getPassword()
    const token = await this.fetchToken(walletId, password)

    const signTxnPromises: Promise<Uint8Array>[] = []
    const signedIndexes: number[] = []

    const msgpackTxnGroup: Uint8Array[] = normalizeTxnGroup(txnGroup)

    // Decode transactions to access properties
    const decodedObjects = msgpackTxnGroup.map((txn) => {
      return algosdk.decodeObj(txn)
    }) as Array<EncodedTransaction | EncodedSignedTransaction>

    // Determine which transactions to sign
    decodedObjects.forEach((txnObject, idx) => {
      const isSigned = isSignedTxnObject(txnObject)
      const shouldSign = shouldSignTxnObject(txnObject, this.addresses, indexesToSign, idx)

      const txnBuffer: Uint8Array = msgpackTxnGroup[idx]!
      const txn: algosdk.Transaction = isSigned
        ? algosdk.decodeSignedTransaction(txnBuffer).txn
        : algosdk.decodeUnsignedTransaction(txnBuffer)

      if (shouldSign) {
        signTxnPromises.push(this.client!.signTransaction(token, password, txn))
        signedIndexes.push(idx)
      }
    })

    // Sign transactions
    const signedTxns = await Promise.all(signTxnPromises)

    // Release token
    await this.releaseToken(token)

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
      throw new Error('[KmdWallet] Client not initialized!')
    }
    const walletId = this.walletId || (await this.fetchWalletId())
    const password = this.getPassword()
    const token = await this.fetchToken(walletId, password)

    const signTxnPromises: Promise<Uint8Array>[] = []

    txnGroup.forEach((txn, idx) => {
      if (indexesToSign.includes(idx)) {
        signTxnPromises.push(this.client!.signTransaction(token, password, txn))
      }
    })

    const signedTxns = await Promise.all(signTxnPromises)

    return signedTxns
  }

  private fetchWalletId = async (): Promise<string> => {
    console.info('[KmdWallet] Fetching wallet data...')
    if (!this.client) {
      throw new Error('Client not initialized!')
    }
    const { wallets }: ListWalletsResponse = await this.client.listWallets()
    const wallet = wallets.find((wallet: KmdWalletRecord) => wallet.name === this.walletName)
    if (!wallet) {
      throw new Error(`Wallet ${this.walletName} not found!`)
    }

    this.walletId = wallet.id
    return wallet.id
  }

  private fetchToken = async (walletId: string, password: string): Promise<string> => {
    console.info('[KmdWallet] Fetching token...')
    if (!this.client) {
      throw new Error('Client not initialized!')
    }
    const { wallet_handle_token }: InitWalletHandleResponse = await this.client.initWalletHandle(
      walletId,
      password
    )
    return wallet_handle_token
  }

  private fetchAccounts = async (token: string): Promise<string[]> => {
    console.info('[KmdWallet] Fetching accounts...')
    if (!this.client) {
      throw new Error('Client not initialized!')
    }
    const { addresses }: ListKeysResponse = await this.client.listKeys(token)
    return addresses
  }

  private releaseToken = async (token: string): Promise<void> => {
    console.info('[KmdWallet] Releasing token...')
    if (!this.client) {
      throw new Error('Client not initialized!')
    }
    await this.client.releaseWalletHandle(token)
  }

  private getPassword = (): string => {
    if (this.password) {
      return this.password
    }
    const password = prompt('KMD password') || ''
    this.password = password
    return password
  }
}
