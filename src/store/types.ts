import type { WalletId } from 'src/constants'
import type { NetworkId } from 'src/network'
import type { WalletAccount } from 'src/types/wallet'

export type WalletState = {
  accounts: WalletAccount[]
  activeAccount: WalletAccount | null
}

export interface State {
  wallets: Map<WalletId, WalletState>
  activeWallet: WalletId | null
  activeNetwork: NetworkId
}
