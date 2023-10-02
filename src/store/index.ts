import { Store } from './store'
import { actions } from './actions'
import { mutations } from './mutations'
import type { State } from 'src/types/state'

export * from './store'

export const defaultState: State = {
  wallets: new Map(),
  activeWallet: null
}

export const createStore = (state: State) => {
  return new Store<State>({
    state,
    mutations,
    actions
  })
}
