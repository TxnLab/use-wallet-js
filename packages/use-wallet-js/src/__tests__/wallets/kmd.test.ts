/* eslint-disable @typescript-eslint/no-unused-vars */
import { Store } from '@tanstack/store'
import algosdk from 'algosdk'
import { StorageAdapter } from 'src/storage'
import { LOCAL_STORAGE_KEY, State, defaultState } from 'src/store'
import { KmdWallet } from 'src/wallets/kmd'
import { WalletId } from 'src/wallets/types'

const TEST_ADDRESS = '7ZUECA7HFLZTXENRV24SHLU4AVPUTMTTDUFUBNBD64C73F3UHRTHAIOF6Q'

// Mock storage adapter
vi.mock('src/storage', () => ({
  StorageAdapter: {
    getItem: vi.fn(),
    setItem: vi.fn()
  }
}))

// Spy/suppress console output
vi.spyOn(console, 'info').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})
vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {})

vi.mock('algosdk', async (importOriginal) => {
  const algosdk = await importOriginal<typeof import('algosdk')>()

  class KmdMock {
    constructor() {}
    listWallets = vi.fn(() => {
      return Promise.resolve({
        wallets: [{ id: 'mockId', name: 'unencrypted-default-wallet' }]
      })
    })
    initWalletHandle = vi.fn(() => {
      return Promise.resolve({ wallet_handle_token: 'token' })
    })
    listKeys = vi.fn(() => {
      return Promise.resolve({
        addresses: [TEST_ADDRESS]
      })
    })
    releaseWalletHandle = vi.fn(() => {
      return Promise.resolve({})
    })
    signTransaction = vi.fn((token: string, password: string, txn: algosdk.Transaction) => {
      const dummySignature = new Uint8Array(64).fill(0) // 64-byte signature filled with zeros
      const dummyTxID = txn.txID()
      const encodedTxn = algosdk.encodeUnsignedTransaction(txn)

      const signedTxn = {
        txID: dummyTxID,
        blob: encodedTxn,
        sig: dummySignature
      }

      return Promise.resolve(signedTxn)
    })
  }

  const algosdkDefault = {
    ...algosdk,
    Kmd: KmdMock
  }

  return {
    default: algosdkDefault,
    Kmd: KmdMock
  }
})

describe('KmdWallet', () => {
  let wallet: KmdWallet
  let store: Store<State>
  let mockInitialState: State | null = null

  const mockSubscribe: (callback: (state: State) => void) => () => void = vi.fn(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (callback: (state: State) => void) => {
      return () => console.log('unsubscribe')
    }
  )

  beforeEach(() => {
    vi.clearAllMocks()
    global.prompt = vi.fn().mockReturnValue('')

    vi.mocked(StorageAdapter.getItem).mockImplementation((key: string) => {
      if (key === LOCAL_STORAGE_KEY && mockInitialState !== null) {
        return JSON.stringify(mockInitialState)
      }
      return null
    })

    vi.mocked(StorageAdapter.setItem).mockImplementation((key: string, value: string) => {
      if (key === LOCAL_STORAGE_KEY) {
        mockInitialState = JSON.parse(value)
      }
    })

    store = new Store<State>(defaultState)
    wallet = new KmdWallet({
      id: WalletId.KMD,
      metadata: {},
      getAlgodClient: {} as any,
      store,
      subscribe: mockSubscribe
    })
  })

  afterEach(async () => {
    global.prompt = vi.fn()
    await wallet.disconnect()
    mockInitialState = null
  })

  describe('connect', () => {
    it('should initialize client, return account objects, and update store', async () => {
      const account1 = {
        name: 'KMD Wallet 1',
        address: TEST_ADDRESS
      }

      const accounts = await wallet.connect()

      expect(wallet.isConnected).toBe(true)
      expect(accounts).toEqual([account1])
      expect(store.state.wallets[WalletId.KMD]).toEqual({
        accounts: [account1],
        activeAccount: account1
      })
    })
  })

  describe('disconnect', () => {
    it('should disconnect client and remove wallet from store', async () => {
      await wallet.connect()

      expect(wallet.isConnected).toBe(true)
      expect(store.state.wallets[WalletId.KMD]).toBeDefined()

      await wallet.disconnect()
      expect(wallet.isConnected).toBe(false)
      expect(store.state.wallets[WalletId.KMD]).toBeUndefined()
    })
  })

  describe('signTransactions', () => {
    describe('when the client is not initialized', () => {
      it('should throw an error', async () => {
        await expect(wallet.signTransactions([])).rejects.toThrowError(
          '[KmdWallet] Client not initialized!'
        )
      })
    })
  })

  it('should correctly process and sign a single algosdk.Transaction', async () => {
    const txn = new algosdk.Transaction({
      fee: 10,
      firstRound: 51,
      lastRound: 61,
      genesisHash: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
      genesisID: 'testnet-v1.0',
      from: TEST_ADDRESS,
      to: 'GD64YIY3TWGDMCNPP553DZPPR6LDUSFQOIJVFDPPXWEG3FVOJCCDBBHU5A',
      amount: 1000,
      flatFee: true
    })

    await wallet.connect()

    const signedTxnResult = await wallet.signTransactions([txn])

    const expectedSignedTxn = {
      txID: txn.txID(),
      blob: algosdk.encodeUnsignedTransaction(txn),
      sig: new Uint8Array(64).fill(0)
    }

    expect(signedTxnResult).toEqual([expectedSignedTxn])
  })

  it('should correctly process and sign a single algosdk.Transaction group', async () => {
    const txn1 = new algosdk.Transaction({
      fee: 10,
      firstRound: 51,
      lastRound: 61,
      genesisHash: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
      genesisID: 'testnet-v1.0',
      from: TEST_ADDRESS,
      to: 'GD64YIY3TWGDMCNPP553DZPPR6LDUSFQOIJVFDPPXWEG3FVOJCCDBBHU5A',
      amount: 1000,
      flatFee: true
    })

    const txn2 = new algosdk.Transaction({
      fee: 10,
      firstRound: 51,
      lastRound: 61,
      genesisHash: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
      genesisID: 'testnet-v1.0',
      from: TEST_ADDRESS,
      to: 'EW64GC6F24M7NDSC5R3ES4YUVE3ZXXNMARJHDCCCLIHZU6TBEOC7XRSBG4',
      amount: 2000,
      flatFee: true
    })

    algosdk.assignGroupID([txn1, txn2])

    await wallet.connect()

    const signedTxnResult = await wallet.signTransactions([txn1, txn2])

    const expectedSignedTxn1 = {
      txID: txn1.txID(),
      blob: algosdk.encodeUnsignedTransaction(txn1),
      sig: new Uint8Array(64).fill(0)
    }

    const expectedSignedTxn2 = {
      txID: txn2.txID(),
      blob: algosdk.encodeUnsignedTransaction(txn2),
      sig: new Uint8Array(64).fill(0)
    }

    expect(signedTxnResult).toEqual([expectedSignedTxn1, expectedSignedTxn2])
  })
})
