import type { WalletAccount } from 'src/types/wallet'

export function compareAccounts(accounts: WalletAccount[], compareTo: WalletAccount[]): boolean {
  const addresses = new Set(accounts.map((account) => account.address))
  const compareAddresses = new Set(compareTo.map((account) => account.address))

  if (addresses.size !== compareAddresses.size) {
    return false
  }

  // Check if every address in addresses is also in compareAddresses
  for (const address of addresses) {
    if (!compareAddresses.has(address)) {
      return false
    }
  }

  return true
}
