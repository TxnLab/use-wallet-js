import { LOCAL_STORAGE_KEY } from 'src/constants'
import type { State } from 'src/types/state'

export function loadStateFromLocalStorage(): State | null {
  const state = localStorage.getItem(LOCAL_STORAGE_KEY)
  return state ? (JSON.parse(state) as State) : null
}
