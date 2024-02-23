import { useWallet } from '@txnlab/use-wallet-react'
import * as React from 'react'
import styles from './Connect.module.css'

export function Connect() {
  const [isReady, setIsReady] = React.useState(false)

  React.useEffect(() => {
    setIsReady(true)
  }, [])

  const { wallets } = useWallet()

  if (!isReady) {
    return <p className={styles.fallbackMsg}>Loading wallets&hellip;</p>
  }

  return (
    <div>
      {wallets.map((wallet) => (
        <div key={wallet.id}>
          <h4 className={styles.walletName} data-active={wallet.isActive}>
            {wallet.metadata.name}
          </h4>
          <div className={styles.walletButtons}>
            <button type="button" onClick={() => wallet.connect()} disabled={wallet.isConnected}>
              Connect
            </button>
            <button
              type="button"
              onClick={() => wallet.disconnect()}
              disabled={!wallet.isConnected}
            >
              Disconnect
            </button>
            <button
              type="button"
              onClick={() => wallet.setActive()}
              disabled={!wallet.isConnected || wallet.isActive}
            >
              Set Active
            </button>
          </div>
          {wallet.isActive && wallet.accounts.length > 0 && (
            <div>
              <select
                className={styles.walletMenu}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                  const target = event.target
                  wallet.setActiveAccount(target.value)
                }}
              >
                {wallet.accounts.map((account) => (
                  <option key={account.address} value={account.address}>
                    {account.address}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
