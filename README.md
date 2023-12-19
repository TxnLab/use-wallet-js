# UseWallet v3 Alpha - `use-wallet-js`

[![npm version](https://badge.fury.io/js/%40txnlab%2Fuse-wallet-js.svg)](https://badge.fury.io/js/%40txnlab%2Fuse-wallet-js) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`use-wallet-js` is a TypeScript library aimed at integrating Algorand wallets into decentralized applications (dApps). This vanilla JS version is a framework agnostic rewrite of the `@txnlab/use-wallet` React library: https://github.com/TxnLab/use-wallet

:warning: **This library is currently in its alpha stage and is not yet recommended for production use.**

## Overview

This version of UseWallet generally follows the same design principles as the React version, with a few key differences:

1. **Framework Agnostic:** Unlike v2, which uses React Hooks, `use-wallet-js` employs TypeScript classes, making it usable in non-React dApps.

2. **Efficient:** The core library has been optimized for speed and simplicity:

   - Only dependent on `algosdk`
   - Framework-independent
   - Implements on-demand loading for wallet SDKs

3. **Dynamic SDK Initialization:** Instead of initializing all wallet SDKs upfront, `use-wallet-js` dynamically imports the relevant SDK only when a "Connect" action has been triggered.

4. **Network Manager**: The library lets you configure and set the network(s) your application uses, exposing an algod client instance for the current active network. This pattern was inspired by [solid-algo-wallets](https://github.com/SilentRhetoric/solid-algo-wallets) and allows for easy switching between public/local networks.

5. **State Updates**: Each of the exported classes exposes a `subscribe` method for subscribing to state updates. In the absense of React, this provides a way for UI elements to re-render when the state changes.

## Similar Structure to v2

At a high level, `use-wallet-js` retains a familiar structure and API for users of v2.x, principally through the `WalletManager` class. This class echoes the `useWallet` hook API from the previous version, aiming to make transitions between versions as seamless as possible.

While the library in its current form exports only classes, future updates will include framework-specific wrappers for **React**, **Vue**, **Svelte**, and **Solid**. These wrappers will be built on top of the core library, and will be published as separate packages _[TBD]_.

The React wrapper in particular will be as close as possible to a drop-in replacement for the v2.x `useWallet` hook, with a similar API.

## Development Strategy

This repository will serve as the alpha stage for the `@txnlab/use-wallet` v3.0.0 release.

Once it reaches beta stage, the commit history will be patched to a branch on the [TxnLab/use-wallet](https://github.com/TxnLab/use-wallet) repository, with pre-releases published as `@txnlab/use-wallet@3.0.0-beta.*` on NPM.

> Updates will be posted in the #use-wallet channel on the [NFDomains Discord](https://discord.gg/7XcuMTfeZP) and from the [@TxnLab](https://twitter.com/TxnLab) Twitter.

### Feedback and Issues

Feedback from the Algorand community during this stage will impact the quality and utility of the final release! Engage with the development, report bugs, and start discussions using the [GitHub Issues](https://github.com/TxnLab/use-wallet-js/issues).

## Getting Started

Install the package using NPM:

```bash
npm install @txnlab/use-wallet-js
```

Install peer dependencies:

```bash
npm install @blockshake/defly-connect @perawallet/connect @walletconnect/modal @walletconnect/sign-client @walletconnect/types algosdk
```

## Configuration

The `WalletManager` class is the main entry point for the library. It is responsible for initializing the wallet SDKs, managing the network, and handling wallet connections.

```ts
import { NetworkId, WalletId, WalletManager } from '@txnlab/use-wallet-js'

const walletManager = new WalletManager({
  wallets: [
    WalletId.DEFLY,
    WalletId.EXODUS,
    WalletId.PERA,
    {
      id: WalletId.WALLETCONNECT,
      options: { projectId: '<YOUR_PROJECT_ID>' }
    }
  ],
  network: NetworkId.TESTNET
})
```

#### `wallets` (required)

Each wallet you wish to support must be included in the `wallets` array.

To initialize wallets with default options, pass the wallet ID using the `WalletId` enum. To use custom options, pass an object with the `id` and `options` properties.

> **Note:** WalletConnect's `projectId` option is required. You can get a project ID by registering your application at https://cloud.walletconnect.com/

#### `network` (optional)

The `network` property is used to set the default network for the application. It can be set to either `BETANET`, `TESTNET`, `MAINNET`, or `LOCALNET`. The default (if unset) is `TESTNET`.

The active network is persisted to local storage. If your application supports [switching networks](#setactivenetworknetwork-networkid-void), when a user revisits your app or refreshes the page, the active network from the previous session will be restored.

#### `algod` (optional)

The `WalletManager` class exposes an `algodClient` property, which is an instance of the `algosdk.Algodv2` class. This client is initialized with the default network, and can be used to make requests to an Algorand node.

```ts
const algodClient = walletManager.algodClient
```

If the active network changes, the `algodClient` instance will be updated to reflect the new network.

By default, the `algodClient` instance connects to [AlgoNode](https://algonode.io/api/)'s free (as in 🍺) API for public networks, and `http://localhost` for `LOCALNET`. You can override this behavior by passing an `algod` configuration object to the `WalletManager` constructor.

To configure the `algodClient` for the active network only, pass an object with `token`, `baseServer` and `port` properties:

```ts
const walletManager = new WalletManager({
  wallets: [...],
  network: NetworkId.TESTNET,
  algod: {
    token: '<YOUR_TOKEN>',
    baseServer: '<YOUR_SERVER_URL>',
    port: '<YOUR_PORT>', // string | number
  }
})
```

To configure the `algodClient` for specific networks, pass a mapped object of the network(s) you wish to configure, where each key is a `NetworkId` and each value is an `algod` configuration object:

```ts
const walletManager = new WalletManager({
  wallets: [...],
  network: NetworkId.TESTNET,
  algod: {
    [NetworkId.TESTNET]: {
      token: '<YOUR_TOKEN>',
      baseServer: '<YOUR_SERVER_URL>',
      port: '<YOUR_PORT>'
    },
    [NetworkId.MAINNET]: {
      token: '<YOUR_TOKEN>',
      baseServer: '<YOUR_SERVER_URL>',
      port: '<YOUR_PORT>'
    }
  }
})
```

## WalletManager API

The `WalletManager` class manages wallets, networks, and states.

```ts
class WalletManager {
  constructor({
    wallets: Array<T | WalletIdConfig<T>>,
    network?: NetworkId,
    algod?: NetworkConfig
  }: WalletManagerConstructor)
}
```

### Methods

##### `subscribe(callback: (state: State) => void): (() => void)`

- Subscribes to state changes.

  - `callback`: The function to be executed when the state changes.

##### `setActiveNetwork(network: NetworkId): void`

- Sets the active network.

  - `network`: The network to be set as active.

##### `resumeSessions(): Promise<void>`

- Refreshes/resumes the sessions of all wallets.

### Properties

##### `wallets: BaseWallet[]`

- Returns all wallet instances.

##### `activeNetwork: NetworkId`

- Returns the currently active network.

##### `algodClient: algosdk.Algodv2`

- Returns the Algod client for the active network.

##### `blockExplorer: string`

- Returns the block explorer URL for the active network.

##### `chainId: string | undefined`

- Returns the [CAIP-2](https://github.com/ChainAgnostic/namespaces/blob/main/algorand/caip2.md) chain ID for the active network.

##### `activeWallet: BaseWallet | null`

- Returns the currently active wallet instance.

##### `activeWalletAccounts: WalletAccount[] | null`

- Returns accounts of the currently active wallet.

##### `activeWalletAddresses: string[] | null`

- Returns addresses of the currently active wallet's accounts.

##### `activeAccount: WalletAccount | null`

- Returns the currently active account.

##### `activeAddress: string | null`

- Returns the address of the currently active account.

##### `signTransactions`

- Throws an error if no active wallet, or returns the `signTransactions` method from the active wallet:

```ts
public signTransactions(
  txnGroup: algosdk.Transaction[] | algosdk.Transaction[][] | Uint8Array[] | Uint8Array[][],
  indexesToSign?: number[],
  returnGroup?: boolean // default: true
): Promise<Uint8Array[]>
```

##### `transactionSigner: TransactionSigner`

- Throws an error if no active wallet, or returns a [`TransactionSigner`](https://github.com/algorand/js-algorand-sdk/blob/v2.6.0/src/signer.ts#L7-L18) function that signs with the active wallet.

```ts
public transactionSigner(
  txnGroup: algosdk.Transaction[],
  indexesToSign: number[]
): Promise<Uint8Array[]>
```

##### `transactionSignerAccount: TransactionSignerAccount`

- Throws an error if no active account, or returns a [`TransactionSignerAccount`](https://github.com/algorandfoundation/algokit-utils-ts/blob/v4.0.0/docs/code/modules/index.md#gettransactionwithsigner) object with `addr` set to the active address and `signer` set to `this.transactionSigner` (see above).

```ts
/** A wrapper around `TransactionSigner` that also has the sender address. */
interface TransactionSignerAccount {
  addr: Readonly<string>
  signer: TransactionSigner
}
```

## Example UI

In the following example, we'll create a simple UI for connecting, disconnecting, and switching between accounts for each of the supported wallets.

### Create a new Vite project

```bash
# npm 6.x
npm create vite@latest use-wallet-js-demo --template vanilla-ts

# npm 7+, extra double-dash is needed:
npm create vite@latest use-wallet-js-demo -- --template vanilla-ts

# yarn
yarn create vite use-wallet-js-demo --template vanilla-ts

# pnpm
pnpm create vite use-wallet-js-demo --template vanilla-ts
```

📖 Docs: https://vitejs.dev/guide/#scaffolding-your-first-vite-project

### index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>UseWallet v3 Demo</title>
  </head>
  <body>
    <div id="app"></div>
    <script>
      global = globalThis
    </script>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### main.ts

```ts
import './style.css'
import { NetworkId, WalletId, WalletManager } from '@txnlab/use-wallet-js'
import { WalletComponent } from './WalletComponent'

const walletManager = new WalletManager({
  wallets: [
    WalletId.DEFLY,
    WalletId.EXODUS,
    WalletId.PERA,
    {
      id: WalletId.WALLETCONNECT,
      options: { projectId: '<YOUR_PROJECT_ID>' }
    }
  ]
})

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>UseWallet v3 Demo</h1>
  </div>
`

const appDiv = document.querySelector('#app')

const walletComponents = walletManager.wallets.map((wallet) => new WalletComponent(wallet))

walletComponents.forEach((walletComponent) => {
  appDiv?.appendChild(walletComponent.element)
})

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await walletManager.resumeSessions()
  } catch (error) {
    console.error('Error resuming sessions:', error)
  }
})

// Cleanup
window.addEventListener('beforeunload', () => {
  walletComponents.forEach((walletComponent) => walletComponent.destroy())
})
```

### WalletComponent.ts

```ts
import { BaseWallet } from '@txnlab/use-wallet-js'

export class WalletComponent {
  wallet: BaseWallet
  element: HTMLElement
  private unsubscribe?: () => void

  constructor(wallet: BaseWallet) {
    this.wallet = wallet
    this.element = document.createElement('div')

    this.unsubscribe = wallet.subscribe((state) => {
      console.log('State change:', state)
      this.render()
    })

    this.render()
    this.addEventListeners()
  }

  connect = () => this.wallet.connect()
  disconnect = () => this.wallet.disconnect()
  setActive = () => this.wallet.setActive()

  setActiveAccount = (event: Event) => {
    const target = event.target as HTMLSelectElement
    this.wallet.setActiveAccount(target.value)
  }

  render() {
    this.element.innerHTML = `
      <h4>
        ${this.wallet.metadata.name} ${this.wallet.isActive ? '[active]' : ''}
      </h4>
      <div>
        <button id="connect-button" type="button" ${this.wallet.isConnected ? 'disabled' : ''}>
            Connect
        </button>
        <button id="disconnect-button" type="button" ${!this.wallet.isConnected ? 'disabled' : ''}>
            Disconnect
        </button>
        <button id="set-active-button" type="button" ${
          !this.wallet.isConnected || this.wallet.isActive ? 'disabled' : ''
        }>
            Set Active
        </button>
      </div>
      ${
        this.wallet.isActive && this.wallet.accounts.length
          ? `
        <div>
          <select>
            ${this.wallet.accounts
              .map(
                (account) => `
              <option value="${account.address}" ${
                account.address === this.wallet.activeAccount?.address ? 'selected' : ''
              }>
                ${account.address}
              </option>
            `
              )
              .join('')}
          </select>
        </div>
      `
          : ''
      }
    `
  }

  addEventListeners() {
    // Connect, disconnect, and set active wallet
    this.element.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement
      if (target.id === 'connect-button') {
        this.connect()
      } else if (target.id === 'disconnect-button') {
        this.disconnect()
      } else if (target.id === 'set-active-button') {
        this.setActive()
      }
    })

    // Change active account
    this.element.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLElement
      if (target.tagName.toLowerCase() === 'select') {
        this.setActiveAccount(e)
      }
    })
  }

  destroy() {
    // Disconnect the listener on unmount to prevent memory leaks
    if (this.unsubscribe) {
      this.unsubscribe()
    }
    this.element.removeEventListener('click', this.addEventListeners)
    this.element.removeEventListener('change', this.addEventListeners)
  }
}
```

## Switching Networks

> _Coming soon_

## Signing Transactions

> _Coming soon_

## License

MIT ©2023 [TxnLab, Inc.](https://txnlab.dev)
