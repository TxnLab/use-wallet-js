import { WALLET_ID } from 'src/constants/wallet'
import type { PersistedState, WalletAccount } from 'src/types/wallet'

export function processNewAccounts(
  id: WALLET_ID,
  newAccounts: WalletAccount[],
  currentAccounts: WalletAccount[]
): PersistedState {
  const otherAccounts = currentAccounts.filter((account) => account.walletId !== id)
  const accounts = [...otherAccounts, ...newAccounts]

  const activeAccount: WalletAccount | null =
    newAccounts.length > 0 ? newAccounts?.[0] || null : null

  return {
    accounts,
    activeAccount
  }
}
