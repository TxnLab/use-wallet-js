import { WALLET_ID } from 'src/constants'
import type { Transaction } from 'algosdk'
import type { WalletAccount } from 'src/types/wallet'

export abstract class WalletClient {
  public readonly id: WALLET_ID

  protected constructor(id: WALLET_ID) {
    this.id = id
  }

  abstract connect(onDisconnect: () => void): Promise<WalletAccount[]>
  abstract reconnect(onDisconnect: () => void): Promise<WalletAccount[] | void>
  abstract disconnect(): Promise<void>

  abstract transactionSigner(
    connectedAccounts: string[],
    txnGroup: Transaction[] | Uint8Array[] | Uint8Array[][],
    indexesToSign?: number[],
    returnGroup?: boolean
  ): Promise<Uint8Array[]>
}
