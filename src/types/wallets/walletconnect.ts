import type { WalletConnectModalConfig } from '@walletconnect/modal'
import type { SignClientTypes } from '@walletconnect/types'

export type SignClientOptions = {
  projectId: string
  relayUrl?: string
  metadata?: SignClientTypes.Metadata
}

export type WalletConnectModalOptions = Pick<
  WalletConnectModalConfig,
  | 'enableExplorer'
  | 'explorerRecommendedWalletIds'
  | 'privacyPolicyUrl'
  | 'termsOfServiceUrl'
  | 'themeMode'
  | 'themeVariables'
>

export type WalletConnectOptions = SignClientOptions & WalletConnectModalOptions
