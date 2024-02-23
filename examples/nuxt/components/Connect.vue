<script setup lang="ts">
import { useWallet } from '@txnlab/use-wallet-vue'

const { wallets: walletsRef } = useWallet()
const wallets = walletsRef.value
</script>

<template>
  <section>
    <div v-for="wallet in wallets" :key="wallet.id">
      <h4 class="wallet-name" :data-active="wallet.isActive">
        {{ wallet.metadata.name }}
      </h4>
      <div class="wallet-buttons">
        <button @click="wallet.connect()" :disabled="wallet.isConnected">Connect</button>
        <button @click="wallet.disconnect()" :disabled="!wallet.isConnected">Disconnect</button>
        <button @click="wallet.setActive()" :disabled="!wallet.isConnected || wallet.isActive">
          Set Active
        </button>
      </div>
      <div v-if="wallet.isActive && wallet.accounts.length > 0">
        <select
          class="wallet-menu"
          @change="(event) => wallet.setActiveAccount((event.target as HTMLSelectElement).value)"
        >
          <option
            v-for="account in wallet.accounts"
            :key="account.address"
            :value="account.address"
          >
            {{ account.address }}
          </option>
        </select>
      </div>
    </div>
  </section>
</template>

<style scoped>
section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.5;
}

.wallet-name {
  line-height: 1.5;
  margin-bottom: 1.33em;
  text-align: center;
  font-weight: bold;
}

.wallet-name[data-active='true']:after {
  content: ' [active]';
}

.wallet-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5em;
  margin-bottom: 0.9em;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  color: white;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}
button:not(:disabled):hover {
  border-color: #00dc82;
}
button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}
button:disabled {
  opacity: 0.75;
  cursor: default;
  color: #999;
}

.wallet-menu {
  margin-top: 1.5em;
}

@media (prefers-color-scheme: light) {
  button {
    background-color: #f9f9f9;
    color: #1a1a1a;
  }

  .wallet-menu {
    border: 1px solid rgb(118, 118, 118);
  }
}

@media (prefers-color-scheme: dark) {
  .wallet-menu {
    border: 1px solid rgb(133, 133, 133);
    background-color: rgb(59, 59, 59);
    color: white;
  }
}
</style>
