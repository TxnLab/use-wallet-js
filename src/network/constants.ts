import { createDefaultConfig } from './utils'
import type {
  BlockExplorerMap,
  CaipChainMap,
  NetworkConfigMap,
  NetworkLabelMap,
  NodeServerMap
} from './types'

export enum NetworkId {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  BETANET = 'betanet',
  LOCALNET = 'localnet'
}

export const networkLabel: NetworkLabelMap = {
  [NetworkId.MAINNET]: 'Mainnet',
  [NetworkId.TESTNET]: 'Testnet',
  [NetworkId.BETANET]: 'Betanet',
  [NetworkId.LOCALNET]: 'Localnet'
}

export const caipChainId: CaipChainMap = {
  [NetworkId.MAINNET]: 'algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73k',
  [NetworkId.TESTNET]: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDe',
  [NetworkId.BETANET]: 'algorand:mFgazF-2uRS1tMiL9dsj01hJGySEmPN2'
}

export const blockExplorer: BlockExplorerMap = {
  [NetworkId.MAINNET]: 'https://algoexplorer.io',
  [NetworkId.TESTNET]: 'https://testnet.algoexplorer.io',
  [NetworkId.BETANET]: 'https://betanet.algoexplorer.io',
  [NetworkId.LOCALNET]: 'https://app.dappflow.org'
}

export const nodeServerMap: NodeServerMap = {
  [NetworkId.MAINNET]: 'https://mainnet-api.algonode.cloud',
  [NetworkId.TESTNET]: 'https://testnet-api.algonode.cloud',
  [NetworkId.BETANET]: 'https://betanet-api.algonode.cloud',
  [NetworkId.LOCALNET]: 'http://localhost'
}

export const defaultNetworkConfigMap: NetworkConfigMap = {
  [NetworkId.MAINNET]: createDefaultConfig(NetworkId.MAINNET),
  [NetworkId.TESTNET]: createDefaultConfig(NetworkId.TESTNET),
  [NetworkId.BETANET]: createDefaultConfig(NetworkId.BETANET),
  [NetworkId.LOCALNET]: createDefaultConfig(NetworkId.LOCALNET)
}
