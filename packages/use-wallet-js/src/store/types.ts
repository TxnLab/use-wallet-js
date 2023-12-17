import { NetworkId } from 'src/network'
import { WalletId, type WalletAccount } from 'src/wallets'

export type WalletState = {
  accounts: WalletAccount[]
  activeAccount: WalletAccount | null
}

export interface State {
  wallets: Map<WalletId, WalletState>
  activeWallet: WalletId | null
  activeNetwork: NetworkId
}
