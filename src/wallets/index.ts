import { BaseWallet } from './base'
import { ExodusWallet } from './exodus'
import { PeraWallet } from './pera'
import { WALLET_ID } from 'src/constants'

export type WalletMap = {
  [WALLET_ID.EXODUS]: typeof ExodusWallet
  [WALLET_ID.PERA]: typeof PeraWallet
}

function createWalletMap(): WalletMap {
  return {
    [WALLET_ID.EXODUS]: ExodusWallet,
    [WALLET_ID.PERA]: PeraWallet
  }
}

const allWallets = createWalletMap()

export { allWallets, BaseWallet, ExodusWallet, PeraWallet }
