import { WalletManager, type WalletManagerConfig, defaultState } from '@txnlab/use-wallet-js'
import { reactive, readonly } from 'vue'

export const WalletManagerPlugin = {
  install(app: any, options: WalletManagerConfig) {
    const manager = new WalletManager(options)
    let state = reactive({ ...defaultState })

    manager.subscribe((newState) => {
      state = { ...newState }
    })

    app.provide('walletManager', manager)
    app.provide('walletState', readonly(state))
  }
}
