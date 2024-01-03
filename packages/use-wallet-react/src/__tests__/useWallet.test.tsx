import { Store } from '@tanstack/react-store'
import { renderHook, act } from '@testing-library/react'
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
import React from 'react'
import { Wallet, useWallet } from '../useWallet'
import { WalletProvider } from '../WalletProvider'

vi.mock('@tanstack/react-store', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@tanstack/react-store')>()
  return {
    ...mod,
    useStore: vi.fn().mockImplementation((store, selector) => {
      const state = defaultState
      return selector(state)
    })
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
  let wrapper: React.FC<{ children: React.ReactNode }>

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

    wrapper = ({ children }: { children: React.ReactNode }) => (
      <WalletProvider manager={mockWalletManager}>{children}</WalletProvider>
    )
  })

  it('initializes wallets and active wallet correctly', async () => {
    const { result } = renderHook(() => useWallet(), { wrapper })

    expect(result.current.wallets).toEqual(mockWallets)
    expect(result.current.activeWallet).toBeNull()
    expect(result.current.activeAccount).toBeNull()
    expect(result.current.activeNetwork).toBe(NetworkId.TESTNET)
  })

  it('correctly handles wallet connect/disconnect', async () => {
    const { result } = renderHook(() => useWallet(), { wrapper })

    // Simulate connect and disconnect
    await act(async () => {
      await result.current.wallets[0].connect()
      await result.current.wallets[0].disconnect()
    })

    expect(mockConnect).toHaveBeenCalled()
    expect(mockDisconnect).toHaveBeenCalled()
  })
})
