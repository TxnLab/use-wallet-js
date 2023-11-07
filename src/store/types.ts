import type { NetworkId } from 'src/network'
import type { WalletAccount, WalletId } from 'src/wallets'

export type WalletState = {
  accounts: WalletAccount[]
  activeAccount: WalletAccount | null
}

export interface State {
  wallets: Map<WalletId, WalletState>
  activeWallet: WalletId | null
  activeNetwork: NetworkId
}
