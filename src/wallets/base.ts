import { WALLET_ID } from 'src/constants'
import type { Transaction } from 'algosdk'
import type { Account } from 'src/types/wallet'

export abstract class BaseClient {
  id: WALLET_ID
  accounts: Account[] = []

  protected constructor(id: WALLET_ID) {
    this.id = id
  }

  abstract connect(onDisconnect: () => void): Promise<Account[]>
  abstract reconnect(onDisconnect: () => void): Promise<Account[]>
  abstract disconnect(): Promise<void>

  abstract transactionSigner(
    txnGroup: Transaction[] | Uint8Array[],
    indexesToSign: number[]
  ): Promise<Uint8Array[]>
}
