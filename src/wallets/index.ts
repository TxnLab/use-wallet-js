import { BaseWallet } from './base'
import { DeflyWallet } from './defly'
import { ExodusWallet } from './exodus'
import { MyAlgoWallet } from './myalgo'
import { PeraWallet } from './pera'
import { WALLET_ID } from 'src/constants'

export type WalletMap = {
  [WALLET_ID.DEFLY]: typeof DeflyWallet
  [WALLET_ID.EXODUS]: typeof ExodusWallet
  [WALLET_ID.MYALGO]: typeof MyAlgoWallet
  [WALLET_ID.PERA]: typeof PeraWallet
}

function createWalletMap(): WalletMap {
  return {
    [WALLET_ID.DEFLY]: DeflyWallet,
    [WALLET_ID.EXODUS]: ExodusWallet,
    [WALLET_ID.MYALGO]: MyAlgoWallet,
    [WALLET_ID.PERA]: PeraWallet
  }
}

const allWallets = createWalletMap()

export { allWallets, BaseWallet, ExodusWallet, PeraWallet }
