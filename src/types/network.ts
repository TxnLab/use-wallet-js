import type { AlgodTokenHeader, BaseHTTPClient, CustomTokenHeader } from 'algosdk'
import type { NetworkId } from 'src/constants'
import type { Store } from 'src/store'
import type { State } from 'src/types/state'

export type NetworkLabelMap = Record<NetworkId, string>
export type BlockExplorerMap = Record<NetworkId, string>
export type CaipChainMap = Partial<Record<NetworkId, string>>
export type NodeServerMap = Record<NetworkId, string>

export interface AlgodConfig {
  token: string | AlgodTokenHeader | CustomTokenHeader | BaseHTTPClient
  baseServer: string
  port?: string | number
  headers?: Record<string, string>
}

export type NetworkConfigMap = Record<NetworkId, AlgodConfig>

export type NetworkConfig = Partial<AlgodConfig> | Partial<Record<NetworkId, Partial<AlgodConfig>>>

export interface NetworkConstructor {
  config: NetworkConfigMap
  store: Store<State>
  onStateChange: () => void
  subscribe: (callback: (state: State) => void) => () => void
}
