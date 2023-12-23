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
      <div class="wallet-buttons">
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

    // Select a new active account
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
