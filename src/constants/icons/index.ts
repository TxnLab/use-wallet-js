import { WalletId } from '../wallet'
import { deflyIcon } from './defly'
import { exodusIcon } from './exodus'
import { kmdIcon } from './kmd'
import { mnemonicIcon } from './mnemonic'
import { myalgoIcon } from './myalgo'
import { peraIcon } from './pera'
import { walletconnectIcon } from './walletconnect'

export const walletIcons: { [key in WalletId]: string } = {
  [WalletId.DEFLY]: deflyIcon,
  [WalletId.EXODUS]: exodusIcon,
  [WalletId.KMD]: kmdIcon,
  [WalletId.MNEMONIC]: mnemonicIcon,
  [WalletId.MYALGO]: myalgoIcon,
  [WalletId.PERA]: peraIcon,
  [WalletId.WALLETCONNECT]: walletconnectIcon
}

export const getWalletIcon = (walletId: WalletId) => walletIcons[walletId]
