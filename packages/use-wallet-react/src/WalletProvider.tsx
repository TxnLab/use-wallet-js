'use client'

import * as React from 'react'

import { WalletManager, State, defaultState } from '@txnlab/use-wallet-js'

interface IContext {
  manager: WalletManager
  state: State
}

const WalletContext = React.createContext<IContext>({} as IContext)

export const useWalletManager = (): IContext => {
  const context = React.useContext(WalletContext)

  if (!context) {
    throw new Error('useWallet must be used within the WalletProvider')
  }

  return context
}

interface IWalletProvider {
  manager: WalletManager
  children?: React.ReactNode
}

export const WalletProvider = ({ manager, children }: IWalletProvider): JSX.Element => {
  const [state, setState] = React.useState<State>(defaultState)

  React.useEffect(() => {
    const unsubscribe = manager.subscribe((state) => {
      setState(state)
    })

    const resumeSessions = async () => {
      try {
        await manager.resumeSessions()
      } catch (error) {
        console.error('Error resuming sessions:', error)
      }
    }

    resumeSessions()

    return () => unsubscribe()
  }, [manager])

  return <WalletContext.Provider value={{ manager, state }}>{children}</WalletContext.Provider>
}
