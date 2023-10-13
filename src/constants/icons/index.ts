import { WALLET_ID } from '../wallet'
import { deflyIcon } from './defly'
import { exodusIcon } from './exodus'
import { kmdIcon } from './kmd'
import { mnemonicIcon } from './mnemonic'
import { myalgoIcon } from './myalgo'
import { peraIcon } from './pera'
import { walletconnectIcon } from './walletconnect'

export const walletIcons: { [key in WALLET_ID]: string } = {
  [WALLET_ID.DEFLY]: deflyIcon,
  [WALLET_ID.EXODUS]: exodusIcon,
  [WALLET_ID.KMD]: kmdIcon,
  [WALLET_ID.MNEMONIC]: mnemonicIcon,
  [WALLET_ID.MYALGO]: myalgoIcon,
  [WALLET_ID.PERA]: peraIcon,
  [WALLET_ID.WALLETCONNECT]: walletconnectIcon
}

export const getWalletIcon = (walletId: WALLET_ID) => walletIcons[walletId]
