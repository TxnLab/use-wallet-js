import { useWallet } from '@txnlab/use-wallet-react'

export function Connect() {
  const { wallets } = useWallet()

  return (
    <div>
      {wallets.map((wallet) => (
        <div key={wallet.id}>
          <h4>
            {wallet.metadata.name} {wallet.isActive ? '[active]' : ''}
          </h4>
          <div className="wallet-buttons">
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
