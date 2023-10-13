# UseWallet v3 Alpha - `use-wallet-js`

<!-- [![npm version](https://badge.fury.io/js/%40txnlab%2Fuse-wallet-js.svg)](https://badge.fury.io/js/%40txnlab%2Fuse-wallet-js) -->

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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

## Similar Structure/API to v2

At a high level, `use-wallet-js` retains a familiar structure and API for users of v2.x, principally through the `WalletManager` class. This class echoes the `useWallet` hook API from the previous version, aiming to make transitions between versions as seamless as possible.

While the library in its current form exports only classes, future updates will include framework-specific wrappers for React, Vue, Svelte, and Solid. These wrappers will be built on top of the core library, and will be published as separate packages [TBD].

The React wrapper in particular will be as close as possible to a drop-in replacement for the v2.x `useWallet` hook, with the same API and behavior.

## Development/QA Strategy

This repository will serve as the alpha stage for the `@txnlab/use-wallet` v3.0.0 release.

Once it reaches beta stage, the commit history will be patched to a branch on the [TxnLab/use-wallet](https://github.com/TxnLab/use-wallet) repository, with pre-releases published as `@txnlab/use-wallet@3.0.0-beta.*` on NPM.

### Stay Updated

For development updates, milestone achievements, and info about the transition from alpha to beta:

- Join our #use-wallet [Discord channel](https://discord.gg/7XcuMTfeZP).
- Follow us on Twitter [@TxnLab](https://twitter.com/TxnLab).

### Feedback and Issues

Your involvement and feedback during this stage will impact the quality and utility of the final release. Engage with the development, report bugs, and start discussions using the [GitHub Issues](https://github.com/TxnLab/use-wallet-js/issues).

We value your participation and look forward to engaging with the Algorand community through every stage of development!

## Getting Started

### Installation, Examples, and Demos

Details on installation procedures, example usage, and a demo application will be available shortly to assist with exploring and implementing `use-wallet-js`.
