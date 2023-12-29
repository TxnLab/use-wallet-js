import algosdk from 'algosdk'
import { NetworkId } from './constants'

export type NetworkLabelMap = Record<NetworkId, string>
export type BlockExplorerMap = Record<NetworkId, string>
export type CaipChainMap = Partial<Record<NetworkId, string>>
export type NodeServerMap = Record<NetworkId, string>

export interface AlgodConfig {
  token: string | algosdk.AlgodTokenHeader | algosdk.CustomTokenHeader | algosdk.BaseHTTPClient
  baseServer: string
  port?: string | number
  headers?: Record<string, string>
}

export type NetworkConfigMap = Record<NetworkId, AlgodConfig>

export type NetworkConfig = Partial<AlgodConfig> | Partial<Record<NetworkId, Partial<AlgodConfig>>>
