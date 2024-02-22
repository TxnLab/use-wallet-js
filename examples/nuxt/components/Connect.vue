<script setup lang="ts">
import { useWallet } from '@txnlab/use-wallet-vue'

const { wallets: walletsRef } = useWallet()
const wallets = walletsRef.value
</script>

<template>
  <section>
    <div v-for="wallet in wallets" :key="wallet.id">
      <h4>{{ wallet.metadata.name }} <span v-if="wallet.isActive">[active]</span></h4>
      <div class="wallet-buttons">
        <button @click="wallet.connect()" :disabled="wallet.isConnected">Connect</button>
        <button @click="wallet.disconnect()" :disabled="!wallet.isConnected">Disconnect</button>
        <button @click="wallet.setActive()" :disabled="!wallet.isConnected || wallet.isActive">
          Set Active
        </button>
      </div>
      <div v-if="wallet.isActive && wallet.accounts.length > 0">
        <select
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

.wallet-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5em;
  margin-bottom: 2em;
}

h4 {
  margin-bottom: 0.5em;
  font-weight: 600;
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

@media (prefers-color-scheme: light) {
  button {
    background-color: #f9f9f9;
  }
}
</style>
