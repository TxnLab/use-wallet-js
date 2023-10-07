type AlgorandChainIDs = 416001 | 416002 | 416003 | 4160

export interface PeraWalletConnectOptions {
  bridge?: string
  shouldShowSignTxnToast?: boolean
  chainId?: AlgorandChainIDs
  compactMode?: boolean
}
