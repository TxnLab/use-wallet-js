import { NetworkId, nodeServerMap } from './constants'
import type { AlgodConfig, NetworkConfig, NetworkConfigMap } from './types'

export function isValidNetworkId(networkId: any): networkId is NetworkId {
  return Object.values(NetworkId).includes(networkId)
}

export function isNetworkConfigMap(config: NetworkConfig): config is NetworkConfigMap {
  const networkKeys = Object.values(NetworkId) as string[]
  return Object.keys(config).some((key) => networkKeys.includes(key))
}

export function createDefaultConfig(networkId: NetworkId): AlgodConfig {
  return {
    token: '',
    baseServer: nodeServerMap[networkId],
    port: '',
    headers: {}
  }
}
