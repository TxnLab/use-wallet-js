import { NetworkId, WalletId, WalletManager } from '@txnlab/use-wallet-js'
import { WalletProvider } from '@txnlab/use-wallet-solid'
import { Connect } from './Connect'
import solidLogo from './assets/solid.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const walletManager = new WalletManager({
    wallets: [
      WalletId.DEFLY,
      WalletId.EXODUS,
      WalletId.PERA,
      {
        id: WalletId.WALLETCONNECT,
        options: { projectId: 'fcfde0713d43baa0d23be0773c80a72b' }
      },
      WalletId.KMD
    ],
    network: NetworkId.TESTNET
  })

  return (
    <WalletProvider manager={walletManager}>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} class="logo" alt="Vite logo" />
        </a>
        <a href="https://solidjs.com" target="_blank">
          <img src={solidLogo} class="logo solid" alt="Solid logo" />
        </a>
      </div>
      <h1>@txnlab/use-wallet-solid</h1>
      <Connect />
    </WalletProvider>
  )
}

export default App
