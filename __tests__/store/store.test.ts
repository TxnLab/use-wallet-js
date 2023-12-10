import { Mock, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { NetworkId } from 'src/network/constants'
import { StoreActions, StoreMutations, createStore, defaultState } from 'src/store'
import { LOCAL_STORAGE_KEY } from 'src/store/constants'
import { replacer } from 'src/store/utils'
import { WalletId } from 'src/wallets/supported/constants'

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
if (typeof localStorage === 'undefined') {
  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock
  })
}

describe('Store', () => {
  beforeEach(() => {
    localStorage.clear()
    ;(console.error as Mock<{ (...data: any[]): void }>).mockClear()
  })

  describe('Initialization', () => {
    it('initializes with provided state', () => {
      const initialState = { ...defaultState }
      const store = createStore(initialState)
      expect(store.getState()).toEqual(initialState)
    })

    it('initializes from persisted state', () => {
      const persistedState = { ...defaultState, activeNetwork: NetworkId.MAINNET }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(persistedState, replacer))
      const store = createStore(defaultState)
      expect(store.getState()).toEqual(persistedState)
    })
  })

  describe('Dispatching Actions', () => {
    it('dispatches a addWallet action correctly', () => {
      const account = {
        name: 'Defly Wallet 1',
        address: 'address'
      }
      const walletState = {
        accounts: [account],
        activeAccount: account
      }
      const store = createStore(defaultState)
      store.dispatch(StoreActions.ADD_WALLET, {
        walletId: WalletId.DEFLY,
        wallet: walletState
      })
      expect(store.getState().wallets.get(WalletId.DEFLY)).toEqual(walletState)
    })

    it('dispatches a removeWallet action correctly', () => {
      const account = {
        name: 'Defly Wallet 1',
        address: 'address'
      }
      const store = createStore({
        ...defaultState,
        wallets: new Map([
          [
            WalletId.DEFLY,
            {
              accounts: [account],
              activeAccount: account
            }
          ]
        ])
      })
      expect(store.getState().wallets.get(WalletId.DEFLY)).toBeDefined()
      store.dispatch(StoreActions.REMOVE_WALLET, { walletId: WalletId.DEFLY })
      expect(store.getState().wallets.get(WalletId.DEFLY)).toBeUndefined()
    })

    // @todo: Should fail if walletId is not in wallets map
    it('dispatches a setActiveWallet action correctly', () => {
      const store = createStore(defaultState)
      store.dispatch(StoreActions.SET_ACTIVE_WALLET, { walletId: WalletId.DEFLY })
      expect(store.getState().activeWallet).toBe(WalletId.DEFLY)
    })

    it('dispatches a setActiveAccount action correctly', () => {
      const account1 = {
        name: 'Defly Wallet 1',
        address: 'address1'
      }
      const account2 = {
        name: 'Defly Wallet 2',
        address: 'address2'
      }
      const store = createStore({
        ...defaultState,
        wallets: new Map([
          [
            WalletId.DEFLY,
            {
              accounts: [account1, account2],
              activeAccount: account1
            }
          ]
        ])
      })
      store.dispatch(StoreActions.SET_ACTIVE_ACCOUNT, {
        walletId: WalletId.DEFLY,
        address: account2.address
      })
      expect(store.getState().wallets.get(WalletId.DEFLY)?.activeAccount).toEqual(account2)
    })

    it('dispatches a setActiveNetwork action correctly', () => {
      const store = createStore(defaultState)
      store.dispatch(StoreActions.SET_ACTIVE_NETWORK, { networkId: NetworkId.MAINNET })
      expect(store.getState().activeNetwork).toBe(NetworkId.MAINNET)
    })

    it('dispatches a setAccounts action correctly', () => {
      const account1 = {
        name: 'Defly Wallet 1',
        address: 'address1'
      }
      const account2 = {
        name: 'Defly Wallet 2',
        address: 'address2'
      }
      const store = createStore({
        ...defaultState,
        wallets: new Map([
          [
            WalletId.DEFLY,
            {
              accounts: [account1],
              activeAccount: account1
            }
          ]
        ])
      })
      store.dispatch(StoreActions.SET_ACCOUNTS, {
        walletId: WalletId.DEFLY,
        accounts: [account1, account2]
      })
      expect(store.getState().wallets.get(WalletId.DEFLY)?.accounts).toEqual([account1, account2])
    })

    it('handles unknown actions correctly', () => {
      const store = createStore(defaultState)
      // @ts-expect-error Unknown action
      const result = store.dispatch('unknownAction', {})
      expect(result).toBeFalsy()
      expect(console.error).toHaveBeenCalledWith(`[Store] Action "unknownAction" doesn't exist`)
    })
  })

  describe('Committing Mutations', () => {
    it('commits a addWallet mutation correctly', () => {
      const account = {
        name: 'Defly Wallet 1',
        address: 'address'
      }
      const walletState = {
        accounts: [account],
        activeAccount: account
      }
      const store = createStore(defaultState)
      store.commit(StoreMutations.ADD_WALLET, {
        walletId: WalletId.DEFLY,
        wallet: walletState
      })
      expect(store.getState().wallets.get(WalletId.DEFLY)).toEqual(walletState)
    })

    it('commits a removeWallet mutation correctly', () => {
      const account = {
        name: 'Defly Wallet 1',
        address: 'address'
      }
      const store = createStore({
        ...defaultState,
        wallets: new Map([
          [
            WalletId.DEFLY,
            {
              accounts: [account],
              activeAccount: account
            }
          ]
        ])
      })
      expect(store.getState().wallets.get(WalletId.DEFLY)).toBeDefined()
      store.commit(StoreMutations.REMOVE_WALLET, { walletId: WalletId.DEFLY })
      expect(store.getState().wallets.get(WalletId.DEFLY)).toBeUndefined()
    })

    // @todo: Should fail if walletId is not in wallets map
    it('commits a setActiveWallet mutation correctly', () => {
      const store = createStore(defaultState)
      store.commit(StoreMutations.SET_ACTIVE_WALLET, { walletId: WalletId.DEFLY })
      expect(store.getState().activeWallet).toBe(WalletId.DEFLY)
    })

    it('commits a setActiveAccount mutation correctly', () => {
      const account1 = {
        name: 'Defly Wallet 1',
        address: 'address1'
      }
      const account2 = {
        name: 'Defly Wallet 2',
        address: 'address2'
      }
      const store = createStore({
        ...defaultState,
        wallets: new Map([
          [
            WalletId.DEFLY,
            {
              accounts: [account1, account2],
              activeAccount: account1
            }
          ]
        ])
      })
      store.commit(StoreMutations.SET_ACTIVE_ACCOUNT, {
        walletId: WalletId.DEFLY,
        address: account2.address
      })
      expect(store.getState().wallets.get(WalletId.DEFLY)?.activeAccount).toEqual(account2)
    })

    it('commits a setActiveNetwork mutation correctly', () => {
      const store = createStore(defaultState)
      store.commit(StoreMutations.SET_ACTIVE_NETWORK, { networkId: NetworkId.MAINNET })
      expect(store.getState().activeNetwork).toBe(NetworkId.MAINNET)
    })

    it('handles unknown mutations correctly', () => {
      const store = createStore(defaultState)
      // @ts-expect-error Unknown mutation
      const result = store.commit('unknownMutation', {})
      expect(result).toBeFalsy()
      expect(console.error).toHaveBeenCalledWith(`[Store] Mutation "unknownMutation" doesn't exist`)
    })
  })

  describe('State Persistence', () => {
    it('saves state to local storage', () => {
      const store = createStore(defaultState)
      store.commit(StoreMutations.SET_ACTIVE_NETWORK, { networkId: NetworkId.MAINNET })
      store.savePersistedState()
      const storedState = localStorage.getItem(LOCAL_STORAGE_KEY)
      expect(storedState).toEqual(JSON.stringify(store.getState(), replacer))
    })

    it('loads state from local storage', () => {
      const persistedState = { ...defaultState, activeNetwork: NetworkId.MAINNET }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(persistedState, replacer))
      const store = createStore(defaultState)
      expect(store.getState()).toEqual(persistedState)
    })
  })

  describe('Proxy Behavior', () => {
    it('updates state through proxy', () => {
      const store = createStore(defaultState)
      const newState = { ...store.getState(), activeNetwork: NetworkId.MAINNET }
      store.commit(StoreMutations.SET_ACTIVE_NETWORK, { networkId: NetworkId.MAINNET })
      expect(store.getState()).toEqual(newState)
    })
  })
})
