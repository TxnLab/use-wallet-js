import { Store } from '@tanstack/vue-store'
import {
  BaseWallet,
  DeflyWallet,
  NetworkId,
  WalletManager,
  WalletId,
  defaultState,
  type State,
  type WalletAccount
} from '@txnlab/use-wallet-js'
import { inject } from 'vue'
import { ref } from 'vue-demi'
import { useWallet, type Wallet } from '../useWallet'

vi.mock('@tanstack/vue-store', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@tanstack/vue-store')>()
  return {
    ...mod,
    useStore: vi.fn().mockImplementation((store, selector) => {
      const state = defaultState
      return ref(selector(state))
    })
  }
})

vi.mock('vue', async (importOriginal) => {
  const mod = await importOriginal<typeof import('vue')>()
  return {
    ...mod,
    inject: vi.fn().mockImplementation(() => new WalletManager())
  }
})

const {
  mockConnect,
  mockDisconnect,
  mockResumeSession,
  mockSignTransactions,
  mockTransactionSigner
} = vi.hoisted(() => {
  return {
    mockConnect: vi.fn(() => Promise.resolve([] as WalletAccount[])),
    mockDisconnect: vi.fn(() => Promise.resolve()),
    mockResumeSession: vi.fn(() => Promise.resolve()),
    mockSignTransactions: vi.fn(() => Promise.resolve([] as Uint8Array[])),
    mockTransactionSigner: vi.fn(() => Promise.resolve([] as Uint8Array[]))
  }
})

vi.mock('@txnlab/use-wallet-js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@txnlab/use-wallet-js')>()
  return {
    ...mod,
    DeflyWallet: class extends mod.BaseWallet {
      connect = mockConnect
      disconnect = mockDisconnect
      resumeSession = mockResumeSession
      signTransactions = mockSignTransactions
      transactionSigner = mockTransactionSigner
    }
  }
})

const mockSubscribe: (callback: (state: State) => void) => () => void = vi.fn(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (callback: (state: State) => void) => {
    return () => console.log('unsubscribe')
  }
)

const mockStore = new Store<State>(defaultState)

const mockDeflyWallet = new DeflyWallet({
  id: WalletId.DEFLY,
  metadata: { name: 'Defly', icon: 'icon' },
  store: mockStore,
  subscribe: mockSubscribe
})

describe('useWallet', () => {
  let mockWalletManager: WalletManager
  let mockWallets: Wallet[]

  beforeEach(() => {
    mockWalletManager = new WalletManager()
    mockWallets = [
      {
        id: WalletId.DEFLY,
        metadata: { name: 'Defly', icon: 'icon' },
        accounts: [],
        activeAccount: null,
        isConnected: false,
        isActive: false,
        connect: expect.any(Function),
        disconnect: expect.any(Function),
        setActive: expect.any(Function),
        setActiveAccount: expect.any(Function)
      }
    ]
    mockWalletManager._clients = new Map<WalletId, BaseWallet>([[WalletId.DEFLY, mockDeflyWallet]])
    mockWalletManager.store = mockStore
  })

  it('throws an error if WalletManager is not installed', () => {
    vi.mocked(inject).mockImplementation(() => null)
    expect(() => useWallet()).toThrow('WalletManager plugin is not properly installed')
  })

  it('initializes wallets and active wallet correctly', () => {
    vi.mocked(inject).mockImplementation(() => mockWalletManager)
    const { wallets, activeWallet, activeAccount, activeNetwork } = useWallet()

    expect(wallets.value).toEqual(mockWallets)
    expect(activeWallet.value).toBeNull()
    expect(activeAccount.value).toBeNull()
    expect(activeNetwork.value).toBe(NetworkId.TESTNET)
  })

  it('correctly handles wallet connect/disconnect', async () => {
    vi.mocked(inject).mockImplementation(() => mockWalletManager)
    const { wallets } = useWallet()

    // Simulate connect and disconnect
    await wallets.value[0].connect()
    await wallets.value[0].disconnect()

    expect(mockConnect).toHaveBeenCalled()
    expect(mockDisconnect).toHaveBeenCalled()
  })
})
