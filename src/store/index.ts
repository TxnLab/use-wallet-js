import { Store } from './store'
import { actions } from './actions'
import { mutations } from './mutations'
import { NetworkId } from 'src/constants'
import type { State } from 'src/types/state'

export * from './store'

export const defaultState: State = {
  wallets: new Map(),
  activeWallet: null,
  activeNetwork: NetworkId.TESTNET
}

export const createStore = (state: State) => {
  return new Store<State>({
    state,
    mutations,
    actions
  })
}
