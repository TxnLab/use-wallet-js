import { describe, expect, it } from 'bun:test'
import { NetworkId } from 'src/network/constants'
import {
  isValidState,
  isValidWalletAccount,
  isValidWalletId,
  isValidWalletState,
  replacer,
  reviver
} from 'src/store/utils'
import { WalletId } from 'src/wallets/supported/constants'

describe('Type Guards', () => {
  describe('isValidWalletId', () => {
    it('returns true for a valid WalletId', () => {
      expect(isValidWalletId(WalletId.DEFLY)).toBe(true)
    })

    it('returns false for an invalid WalletId', () => {
      expect(isValidWalletId('foo')).toBe(false)
    })
  })

  describe('isValidWalletAccount', () => {
    it('returns true for a valid WalletAccount', () => {
      expect(
        isValidWalletAccount({
          name: 'Defly Wallet 1',
          address: 'address'
        })
      ).toBe(true)
    })

    it('returns false for an invalid WalletAccount', () => {
      expect(isValidWalletAccount('foo')).toBe(false)
      expect(isValidWalletAccount(null)).toBe(false)

      expect(
        isValidWalletAccount({
          name: 'Defly Wallet 1',
          address: 123
        })
      ).toBe(false)

      expect(
        isValidWalletAccount({
          address: 'address'
        })
      ).toBe(false)
    })
  })

  describe('isValidWalletState', () => {
    it('returns true for a valid WalletState', () => {
      expect(
        isValidWalletState({
          accounts: [
            {
              name: 'Defly Wallet 1',
              address: 'address'
            }
          ],
          activeAccount: {
            name: 'Defly Wallet 1',
            address: 'address'
          }
        })
      ).toBe(true)

      expect(
        isValidWalletState({
          accounts: [],
          activeAccount: null
        })
      ).toBe(true)
    })

    it('returns false for an invalid WalletState', () => {
      expect(isValidWalletState('foo')).toBe(false)
      expect(isValidWalletState(null)).toBe(false)
    })

    it('returns false if accounts is invalid', () => {
      expect(
        isValidWalletState({
          accounts: null,
          activeAccount: {
            name: 'Defly Wallet 1',
            address: 'address'
          }
        })
      ).toBe(false)

      expect(
        isValidWalletState({
          activeAccount: {
            name: 'Defly Wallet 1',
            address: 'address'
          }
        })
      ).toBe(false)
    })

    it('returns false if activeAccount is invalid', () => {
      expect(
        isValidWalletState({
          accounts: [
            {
              name: 'Defly Wallet 1',
              address: 'address'
            }
          ],
          activeAccount: 'address'
        })
      ).toBe(false)

      expect(
        isValidWalletState({
          accounts: [
            {
              name: 'Defly Wallet 1',
              address: 'address'
            }
          ]
        })
      ).toBe(false)
    })
  })

  describe('isValidState', () => {
    it('returns true for a valid state', () => {
      const defaultState = {
        wallets: new Map(),
        activeWallet: null,
        activeNetwork: NetworkId.TESTNET
      }
      expect(isValidState(defaultState)).toBe(true)

      const state = {
        wallets: new Map([
          [
            WalletId.DEFLY,
            {
              accounts: [
                {
                  name: 'Defly Wallet 1',
                  address: 'address'
                },
                {
                  name: 'Defly Wallet 2',
                  address: 'address'
                }
              ],
              activeAccount: {
                name: 'Defly Wallet 1',
                address: 'address'
              }
            }
          ],
          [
            WalletId.PERA,
            {
              accounts: [
                {
                  name: 'Pera Wallet 1',
                  address: 'address'
                }
              ],
              activeAccount: {
                name: 'Pera Wallet 1',
                address: 'address'
              }
            }
          ]
        ]),
        activeWallet: WalletId.DEFLY,
        activeNetwork: NetworkId.TESTNET
      }
      expect(isValidState(state)).toBe(true)
    })

    it('returns false for an invalid state', () => {
      expect(isValidState('foo')).toBe(false)
      expect(isValidState(null)).toBe(false)

      expect(
        isValidState({
          activeWallet: WalletId.DEFLY,
          activeNetwork: NetworkId.TESTNET
        })
      ).toBe(false)

      expect(
        isValidState({
          wallets: new Map(),
          activeNetwork: NetworkId.TESTNET
        })
      ).toBe(false)

      expect(
        isValidState({
          wallets: new Map(),
          activeWallet: WalletId.DEFLY
        })
      ).toBe(false)
    })
  })
})

describe('Serialization and Deserialization', () => {
  it('correctly serializes and deserializes a state with Map', () => {
    const originalState = {
      wallets: new Map([[WalletId.DEFLY, { accounts: [], activeAccount: null }]])
    }
    const serializedState = JSON.stringify(originalState, replacer)
    const deserializedState = JSON.parse(serializedState, reviver)

    expect(deserializedState).toEqual(originalState)
    expect(deserializedState.wallets instanceof Map).toBe(true)
  })
})
