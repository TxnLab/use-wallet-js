import { Store } from '@tanstack/vue-store'
import {
  BaseWallet,
  DeflyWallet,
  NetworkId,
  StorageAdapter,
  WalletManager,
  WalletId,
  defaultState,
  type State,
  type WalletAccount,
  PeraWallet
} from '@txnlab/use-wallet-js'
import { mount } from '@vue/test-utils'
import { inject, nextTick } from 'vue'
import { useWallet, type Wallet } from '../useWallet'

const mocks = vi.hoisted(() => {
  return {
    connect: vi.fn(() => Promise.resolve([] as WalletAccount[])),
    disconnect: vi.fn(() => Promise.resolve()),
    setActive: vi.fn(),
    setActiveAccount: vi.fn(),
    resumeSession: vi.fn(() => Promise.resolve()),
    signTransactions: vi.fn(() => Promise.resolve([] as Uint8Array[])),
    transactionSigner: vi.fn(() => Promise.resolve([] as Uint8Array[]))
  }
})

vi.mock('@txnlab/use-wallet-js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@txnlab/use-wallet-js')>()
  return {
    ...mod,
    StorageAdapter: {
      getItem: vi.fn(),
      setItem: vi.fn()
    },
    DeflyWallet: class extends mod.BaseWallet {
      connect = mocks.connect
      disconnect = mocks.disconnect
      setActive = mocks.setActive
      setActiveAccount = mocks.setActiveAccount
      resumeSession = mocks.resumeSession
      signTransactions = mocks.signTransactions
      transactionSigner = mocks.transactionSigner
    },
    PeraWallet: class extends mod.BaseWallet {
      connect = mocks.connect
      disconnect = mocks.disconnect
      setActive = mocks.setActive
      setActiveAccount = mocks.setActiveAccount
      resumeSession = mocks.resumeSession
      signTransactions = mocks.signTransactions
      transactionSigner = mocks.transactionSigner
    }
  }
})

vi.mock('vue', async (importOriginal) => {
  const mod = await importOriginal<typeof import('vue')>()
  return {
    ...mod,
    inject: vi.fn().mockImplementation(() => new WalletManager())
  }
})

const LOCAL_STORAGE_KEY = '@txnlab/use-wallet-js'

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

const mockPeraWallet = new PeraWallet({
  id: WalletId.PERA,
  metadata: { name: 'Pera', icon: 'icon' },
  store: mockStore,
  subscribe: mockSubscribe
})

describe('useWallet', () => {
  let mockWalletManager: WalletManager
  let mockWallets: Wallet[]
  let mockInitialState: State | null = null

  beforeEach(() => {
    vi.clearAllMocks()

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

    mockStore.setState(() => defaultState)

    mockWalletManager = new WalletManager()
    mockWallets = [
      {
        id: mockDeflyWallet.id,
        metadata: mockDeflyWallet.metadata,
        accounts: [],
        activeAccount: null,
        isConnected: false,
        isActive: false,
        connect: expect.any(Function),
        disconnect: expect.any(Function),
        setActive: expect.any(Function),
        setActiveAccount: expect.any(Function)
      },
      {
        id: mockPeraWallet.id,
        metadata: mockPeraWallet.metadata,
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
    mockWalletManager._clients = new Map<WalletId, BaseWallet>([
      [WalletId.DEFLY, mockDeflyWallet],
      [WalletId.PERA, mockPeraWallet]
    ])
    mockWalletManager.store = mockStore
  })

  afterEach(() => {
    mockInitialState = null
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

    expect(mocks.connect).toHaveBeenCalled()
    expect(mocks.disconnect).toHaveBeenCalled()
  })

  it('calls setActive and setActiveAccount correctly', () => {
    vi.mocked(inject).mockImplementation(() => mockWalletManager)
    const { wallets } = useWallet()

    // Simulate setActive
    wallets.value[0].setActive()
    wallets.value[0].setActiveAccount('address')

    expect(mocks.setActive).toHaveBeenCalled()
    expect(mocks.setActiveAccount).toHaveBeenCalledWith('address')
  })

  it('calls signTransactions and transactionSigner correctly', async () => {
    vi.mocked(inject).mockImplementation(() => mockWalletManager)
    const { signTransactions, transactionSigner } = useWallet()

    mockStore.setState((state) => ({
      ...state,
      wallets: {
        [WalletId.DEFLY]: {
          accounts: [
            {
              name: 'Defly Account 1',
              address: 'address1'
            }
          ],
          activeAccount: {
            name: 'Defly Account 1',
            address: 'address1'
          }
        }
      },
      activeWallet: WalletId.DEFLY
    }))

    // Simulate signTransactions and transactionSigner
    await signTransactions([], [], true)
    await transactionSigner([], [])

    expect(mocks.signTransactions).toHaveBeenCalledWith([], [], true)
    expect(mocks.transactionSigner).toHaveBeenCalledWith([], [])
  })

  it('updates wallets when store state changes', () => {
    vi.mocked(inject).mockImplementation(() => mockWalletManager)
    const { wallets } = useWallet()

    mockStore.setState((state) => ({
      ...state,
      wallets: {
        [WalletId.DEFLY]: {
          accounts: [
            {
              name: 'Defly Account 1',
              address: 'address1'
            },
            {
              name: 'Defly Account 2',
              address: 'address2'
            }
          ],
          activeAccount: {
            name: 'Defly Account 1',
            address: 'address1'
          }
        }
      },
      activeWallet: WalletId.DEFLY
    }))

    expect(wallets.value).toEqual([
      {
        ...mockWallets[0],
        accounts: [
          {
            name: 'Defly Account 1',
            address: 'address1'
          },
          {
            name: 'Defly Account 2',
            address: 'address2'
          }
        ],
        activeAccount: {
          name: 'Defly Account 1',
          address: 'address1'
        },
        isConnected: true,
        isActive: true
      },
      mockWallets[1]
    ])
  })

  it('integrates correctly with Vue component', async () => {
    vi.mocked(inject).mockImplementation(() => mockWalletManager)
    const { wallets, activeWallet, activeAddress, activeNetwork } = useWallet()

    const TestComponent = {
      template: `
        <div>
          <ul>
            <li v-for="wallet in wallets" :key="wallet.id" data-testid="wallet">
              {{ wallet.metadata.name }}
            </li>
          </ul>
          <div data-testid="activeNetwork">{{ activeNetwork }}</div>
          <div data-testid="activeWallet">{{ activeWallet?.id }}</div>
          <div data-testid="activeAddress">{{ activeAddress }}</div>
        </div>
      `,
      setup() {
        return {
          wallets,
          activeWallet,
          activeAddress,
          activeNetwork
        }
      }
    }

    const wrapper = mount(TestComponent)

    const listItems = wrapper.findAll('[data-testid="wallet"]')
    expect(listItems).toHaveLength(2)

    mockWallets.forEach((wallet, index) => {
      expect(listItems[index].text()).toBe(wallet.metadata.name)
    })

    expect(wrapper.get('[data-testid="activeNetwork"]').text()).toBe(NetworkId.TESTNET)
    expect(wrapper.get('[data-testid="activeWallet"]').text()).toBe('')
    expect(wrapper.get('[data-testid="activeAddress"]').text()).toBe('')

    // Mock a state change in the store
    mockStore.setState((state) => ({
      ...state,
      wallets: {
        [WalletId.DEFLY]: {
          accounts: [
            {
              name: 'Defly Account 1',
              address: 'address1'
            }
          ],
          activeAccount: {
            name: 'Defly Account 1',
            address: 'address1'
          }
        }
      },
      activeWallet: WalletId.DEFLY
    }))

    await nextTick()

    expect(wrapper.get('[data-testid="activeNetwork"]').text()).toBe(NetworkId.TESTNET)
    expect(wrapper.get('[data-testid="activeWallet"]').text()).toBe(WalletId.DEFLY)
    expect(wrapper.get('[data-testid="activeAddress"]').text()).toBe('address1')
  })
})
