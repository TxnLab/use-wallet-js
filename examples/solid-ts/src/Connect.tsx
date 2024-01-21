import { NetworkId } from '@txnlab/use-wallet-js'
import { useWallet } from '@txnlab/use-wallet-solid'
import { For, Show } from 'solid-js'
import encoding from 'algosdk'

export function Connect() {
  const {
    wallets,
    activeNetwork,
    setActiveNetwork,
    activeWallet,
    activeWalletId,
    walletStateMap,
    activeWalletAccounts,
    activeWalletAddresses,
    activeAccount,
    activeAddress,
    algodClient,
    manager
  } = useWallet()

  return (
    <div>
      <For each={wallets()}>
        {(wallet) => (
          <div>
            <h4>
              {wallet.metadata.name}{' '}
              <Show when={wallet.isActive()} fallback="">
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
                disabled={!wallet.isConnected || wallet.isActive()}
              >
                Set Active
              </button>
            </div>

            <Show when={wallet.isActive() && wallet.accounts.length > 0}>
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
      <button onClick={() => setActiveNetwork(NetworkId.MAINNET)}>Set Mainnet</button>
      <button onClick={() => setActiveNetwork(NetworkId.TESTNET)}>Set Testnet</button>
      <p>activeNetwork: {activeNetwork()().toString()}</p>
      <p>activeWalletId: {activeWalletId()}</p>
      <p>activeWallet: {activeWallet()?.metadata.name}</p>
      <p>activeWalletAccounts: {JSON.stringify(activeWalletAccounts())}</p>
      <p>activeWalletAddresses: {activeWalletAddresses()?.join(', ')}</p>
      <p>activeAccount: {JSON.stringify(activeAccount())}</p>
      <p>activeAddress: {activeAddress()}</p>
      <p>algodClient int encoding: {algodClient().getIntEncoding()}</p>
      <button onClick={() => algodClient().setIntEncoding(encoding.IntDecoding.SAFE)}>
        Set Int encoding
      </button>
      <p>walletStateMap: {JSON.stringify(walletStateMap())}</p>
      <pre>manager: {JSON.stringify(manager(), null, 2)}</pre>
    </div>
  )
}
