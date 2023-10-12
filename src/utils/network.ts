import { NetworkId } from 'src/constants'
import type { NetworkConfig, NetworkConfigMap } from 'src/types/network'

export function isNetworkConfigMap(config: NetworkConfig): config is NetworkConfigMap {
  const networkKeys = Object.values(NetworkId) as string[]
  return Object.keys(config).some((key) => networkKeys.includes(key))
}
