import { NetworkId } from 'src/network'
import type { State } from './types'

export const defaultState: State = {
  wallets: new Map(),
  activeWallet: null,
  activeNetwork: NetworkId.TESTNET
}

export const LOCAL_STORAGE_KEY = '@txnlab/use-wallet-js'
