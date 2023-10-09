import type { CustomTokenHeader, KMDTokenHeader } from 'algosdk'

export interface KmdConstructor {
  token: string | KMDTokenHeader | CustomTokenHeader
  baseServer?: string
  port?: string | number
  headers?: Record<string, string>
}

export type KmdOptions = Partial<Pick<KmdConstructor, 'token'>> &
  Omit<KmdConstructor, 'token'> & {
    wallet: string
  }

export interface KmdWalletRecord {
  id: string
  name: string
  driver_name?: string
  driver_version?: number
  mnemonic_ux?: boolean
  supported_txs?: Array<any>
}

export interface ListWalletsResponse {
  wallets: KmdWalletRecord[]
  message?: string
  error?: boolean
}

export interface InitWalletHandleResponse {
  wallet_handle_token: string
  message?: string
  error?: boolean
}

export interface ListKeysResponse {
  addresses: string[]
  message?: string
  error?: boolean
}
