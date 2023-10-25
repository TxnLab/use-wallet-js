import { LOCAL_STORAGE_KEY, NetworkId } from 'src/constants'
import { PubSub } from 'src/lib/pubsub'
import { actions, type Actions, type StoreActions } from './actions'
import { mutations, type Mutations, type StoreMutations } from './mutations'
import { isValidState, replacer, reviver } from './utils'
import type { State } from './types'

export enum Status {
  IDLE = 'idle',
  ACTION = 'action',
  MUTATION = 'mutation'
}

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

export class Store<TState extends object> {
  private actions: Actions<TState>
  private mutations: Mutations<TState>
  private state: TState
  private status: Status
  private events: PubSub

  constructor(params: { actions: Actions<TState>; mutations: Mutations<TState>; state: TState }) {
    this.actions = params.actions
    this.mutations = params.mutations
    this.status = Status.IDLE
    this.events = new PubSub()

    const initialState = this.loadPersistedState() || params.state
    this.state = this.createProxy(initialState)
  }

  private createProxy<T extends object>(state: T): T {
    return new Proxy(state, {
      set: (target, key, value) => {
        console.log('[Store] Proxy set callback', { target, key, value })
        if (key in target) {
          target[key as keyof T] = value

          console.info(`[Store] stateChange: ${String(key)}: ${String(value)}`)
          this.events.publish('stateChange', this.state)

          if (this.status !== Status.MUTATION) {
            console.warn(`[Store] You should use a mutation to set ${String(key)}`)
          }
          this.status = Status.IDLE
          return true
        } else {
          console.warn(`[Store] Property ${String(key)} does not exist on state object.`)
          return false
        }
      }
    })
  }

  public dispatch(actionKey: StoreActions, payload: any): boolean {
    if (typeof this.actions[actionKey] !== 'function') {
      console.error(`[Store] Action "${actionKey}" doesn't exist.`)
      return false
    }

    console.groupCollapsed(`[Store] ACTION: ${actionKey}`)

    this.status = Status.ACTION
    this.actions[actionKey](this, payload)

    console.groupEnd()

    return true
  }

  public commit(mutationKey: StoreMutations, payload: any): boolean {
    if (typeof this.mutations[mutationKey] !== 'function') {
      console.log(`Mutation "${mutationKey}" doesn't exist`)
      return false
    }
    console.info(`[Store] MUTATION: ${mutationKey}`, payload)

    this.status = Status.MUTATION

    const newState = this.mutations[mutationKey](this.state, payload)

    this.state = this.createProxy(newState)
    this.savePersistedState()

    return true
  }

  public getState(): TState {
    return this.state
  }

  public loadPersistedState(): TState | null {
    try {
      const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (serializedState === null) {
        return null
      }
      const parsedState = JSON.parse(serializedState, reviver)
      if (!isValidState(parsedState)) {
        console.error('[Store] Parsed state:', parsedState)
        throw new Error('Persisted state is invalid')
      }
      return parsedState as TState
    } catch (error) {
      console.error('[Store] Could not load state from local storage:', error)
      return null
    }
  }

  public savePersistedState(): void {
    try {
      const state = this.getState()
      const serializedState = JSON.stringify(state, replacer)
      localStorage.setItem(LOCAL_STORAGE_KEY, serializedState)
    } catch (error) {
      console.error('Could not save state to local storage:', error)
    }
  }
}
