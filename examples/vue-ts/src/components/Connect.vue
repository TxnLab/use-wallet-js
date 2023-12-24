<script setup lang="ts">
import { useWallet } from '@txnlab/use-wallet-vue'

const { wallets } = useWallet()
</script>

<template>
  <div>
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
  </div>
</template>

<style scoped>
.wallet-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5em;
  margin-bottom: 2em;
}
</style>
