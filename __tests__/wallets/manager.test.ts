import { beforeEach, describe, expect, it, jest, spyOn } from 'bun:test'
import { NetworkId } from 'src/network/constants'
import { LOCAL_STORAGE_KEY } from 'src/store/constants'
import { replacer } from 'src/store/utils'
import { WalletManager } from 'src/wallets/manager'
import { WalletId } from 'src/wallets/supported/constants'
import { DeflyWallet } from 'src/wallets/supported/defly'
import { PeraWallet } from 'src/wallets/supported/pera'

// Suppress console output
spyOn(console, 'info').mockImplementation(() => {})
spyOn(console, 'warn').mockImplementation(() => {})
spyOn(console, 'error').mockImplementation(() => {})
spyOn(console, 'groupCollapsed').mockImplementation(() => {})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, any> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: any) => (store[key] = value.toString()),
    clear: () => (store = {})
  }
})()
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
})

const deflyResumeSession = spyOn(DeflyWallet.prototype, 'resumeSession').mockImplementation(() =>
  Promise.resolve()
)
const peraResumeSession = spyOn(PeraWallet.prototype, 'resumeSession').mockImplementation(() =>
  Promise.resolve()
)

describe('WalletManager', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('constructor', () => {
    it('initializes with default network and wallets', () => {
      const manager = new WalletManager({
        wallets: [WalletId.DEFLY, WalletId.PERA]
      })
      expect(manager.wallets.length).toBe(2)
      expect(manager.activeNetwork).toBe(NetworkId.TESTNET)
      expect(manager.algodClient).toBeDefined()
    })

    it('initializes with custom network and wallets', () => {
      const manager = new WalletManager({
        wallets: [WalletId.DEFLY, WalletId.PERA],
        network: NetworkId.MAINNET
      })
      expect(manager.wallets.length).toBe(2)
      expect(manager.activeNetwork).toBe(NetworkId.MAINNET)
      expect(manager.algodClient).toBeDefined()
    })

    it('initializes with custom algod config', () => {
      const manager = new WalletManager({
        wallets: [WalletId.DEFLY, WalletId.PERA],
        network: NetworkId.LOCALNET,
        algod: {
          baseServer: 'http://localhost',
          port: '1234',
          token: '1234',
          headers: {
            'X-API-Key': '1234'
          }
        }
      })

      expect(manager.wallets.length).toBe(2)
      expect(manager.activeNetwork).toBe(NetworkId.LOCALNET)
      expect(manager.algodClient).toBeDefined()
    })
  })

  describe('initializeWallets', () => {
    it('initializes wallets from string array', () => {
      const manager = new WalletManager({
        wallets: [WalletId.DEFLY, WalletId.PERA]
      })
      expect(manager.wallets.length).toBe(2)
    })

    it('initializes wallets from WalletIdConfig array', () => {
      const manager = new WalletManager({
        wallets: [
          {
            id: WalletId.DEFLY,
            options: {
              shouldShowSignTxnToast: false
            }
          },
          {
            id: WalletId.WALLETCONNECT,
            options: {
              projectId: '1234'
            }
          }
        ]
      })
      expect(manager.wallets.length).toBe(2)
    })

    it('initializes wallets from mixed array', () => {
      const manager = new WalletManager({
        wallets: [
          WalletId.DEFLY,
          {
            id: WalletId.WALLETCONNECT,
            options: {
              projectId: '1234'
            }
          }
        ]
      })
      expect(manager.wallets.length).toBe(2)
    })

    it('initializes wallets with custom metadata', () => {
      const manager = new WalletManager({
        wallets: [
          {
            id: WalletId.DEFLY,
            metadata: {
              name: 'Custom Wallet',
              icon: 'icon'
            }
          }
        ]
      })
      expect(manager.wallets.length).toBe(1)
      expect(manager.wallets[0]?.metadata.name).toBe('Custom Wallet')
      expect(manager.wallets[0]?.metadata.icon).toBe('icon')
    })

    // @todo: Test for handling of invalid wallet configurations
  })

  describe('setActiveNetwork', () => {
    it('sets active network correctly', () => {
      const manager = new WalletManager({
        wallets: [WalletId.DEFLY, WalletId.PERA]
      })
      manager.setActiveNetwork(NetworkId.MAINNET)
      expect(manager.activeNetwork).toBe(NetworkId.MAINNET)
    })

    // @todo: Test for handling of invalid network
  })

  describe('subscribe', () => {
    it('adds and removes a subscriber', () => {
      const manager = new WalletManager({
        wallets: [WalletId.DEFLY, WalletId.PERA]
      })
      const callback = jest.fn()
      const unsubscribe = manager.subscribe(callback)

      // Trigger a state change
      manager.setActiveNetwork(NetworkId.MAINNET)

      expect(callback).toHaveBeenCalled()

      unsubscribe()
      // Trigger another state change
      manager.setActiveNetwork(NetworkId.BETANET)

      expect(callback).toHaveBeenCalledTimes(1) // Should not be called again
    })
  })

  describe('activeWallet', () => {
    const serializedState = {
      wallets: new Map([
        [
          'pera',
          {
            accounts: [
              {
                name: 'Pera Wallet 1',
                address: '7ZUECA7HFLZTXENRV24SHLU4AVPUTMTTDUFUBNBD64C73F3UHRTHAIOF6Q'
              },
              {
                name: 'Pera Wallet 2',
                address: 'N2C374IRX7HEX2YEQWJBTRSVRHRUV4ZSF76S54WV4COTHRUNYRCI47R3WU'
              }
            ],
            activeAccount: {
              name: 'Pera Wallet 1',
              address: '7ZUECA7HFLZTXENRV24SHLU4AVPUTMTTDUFUBNBD64C73F3UHRTHAIOF6Q'
            }
          }
        ]
      ]),
      activeWallet: 'pera',
      activeNetwork: 'testnet'
    }

    beforeEach(() => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serializedState, replacer))
    })

    it('returns the active wallet', () => {
      const manager = new WalletManager({
        wallets: [WalletId.DEFLY, WalletId.PERA]
      })
      expect(manager.activeWallet?.id).toBe(WalletId.PERA)
    })

    it('returns null if no active wallet', () => {
      localStorage.clear()

      const manager = new WalletManager({
        wallets: [WalletId.DEFLY, WalletId.PERA]
      })
      expect(manager.activeWallet).toBeNull()
    })

    it('returns active wallet accounts', () => {
      const manager = new WalletManager({
        wallets: [WalletId.DEFLY, WalletId.PERA]
      })
      expect(manager.activeWalletAccounts?.length).toBe(2)
      expect(manager.activeWalletAddresses).toEqual([
        '7ZUECA7HFLZTXENRV24SHLU4AVPUTMTTDUFUBNBD64C73F3UHRTHAIOF6Q',
        'N2C374IRX7HEX2YEQWJBTRSVRHRUV4ZSF76S54WV4COTHRUNYRCI47R3WU'
      ])
    })

    it('removes wallets in state that are not in config', () => {
      const manager = new WalletManager({
        wallets: [WalletId.DEFLY]
      })
      expect(manager.wallets.length).toBe(1)
      expect(manager.wallets[0]?.id).toBe(WalletId.DEFLY)
      expect(manager.activeWallet).toBeNull()
    })
  })

  describe('Transaction Signing', () => {
    it('throws error if no active wallet', () => {
      const manager = new WalletManager({
        wallets: [WalletId.DEFLY, WalletId.PERA]
      })
      expect(() => manager.signTransactions).toThrow()
    })

    // @todo: Tests for successful signing
  })

  describe('resumeSessions', () => {
    it('resumes sessions for all wallets', async () => {
      const manager = new WalletManager({
        wallets: [WalletId.DEFLY, WalletId.PERA]
      })
      await manager.resumeSessions()

      expect(deflyResumeSession).toHaveBeenCalled()
      expect(peraResumeSession).toHaveBeenCalled()
    })
  })
})
