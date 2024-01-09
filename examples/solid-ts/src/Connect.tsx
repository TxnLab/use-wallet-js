import { useWallet } from '@txnlab/use-wallet-solid'
import { For, Show } from 'solid-js'

export function Connect() {
  const { wallets } = useWallet()

  return (
    <div>
      <For each={wallets()}>
        {(wallet) => (
          <div>
            <h4>
              {wallet.metadata.name}{' '}
              <Show when={wallet.isActive} fallback="">
                [active]
              </Show>
            </h4>
            <div class="wallet-buttons">
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

            <Show when={wallet.isActive && wallet.accounts.length > 0}>
              <div>
                <select
                  onChange={(event) => {
                    const target = event.target
                    wallet.setActiveAccount(target?.value)
                  }}
                >
                  <For each={wallet.accounts}>
                    {(account) => <option value={account.address}>{account.address}</option>}
                  </For>
                </select>
              </div>
            </Show>
          </div>
        )}
      </For>
    </div>
  )
}
