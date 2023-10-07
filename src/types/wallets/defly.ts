type AlgorandChainIDs = 416001 | 416002 | 416003 | 4160

export interface DeflyWalletConnectOptions {
  bridge?: string
  shouldShowSignTxnToast?: boolean
  chainId?: AlgorandChainIDs
}
