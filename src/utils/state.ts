import { LOCAL_STORAGE_KEY, WALLET_ID } from 'src/constants'
import { ManagerState, WalletState } from 'src/types/wallet'

export function loadWalletState(id: WALLET_ID) {
  const state = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${id}`)
  return state ? (JSON.parse(state) as WalletState) : null
}

export function saveWalletState(id: WALLET_ID, state: WalletState) {
  localStorage.setItem(`${LOCAL_STORAGE_KEY}_${id}`, JSON.stringify(state))
}

export function deleteWalletState(id: WALLET_ID) {
  localStorage.removeItem(`${LOCAL_STORAGE_KEY}_${id}`)
}

export function loadManagerState() {
  const state = localStorage.getItem(LOCAL_STORAGE_KEY)
  return state ? (JSON.parse(state) as ManagerState) : null
}

export function saveManagerState(state: ManagerState) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state))
}

export function deleteManagerState() {
  localStorage.removeItem(LOCAL_STORAGE_KEY)
}
