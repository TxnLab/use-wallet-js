import algosdk from 'algosdk'
import { NetworkId, blockExplorer, caipChainId } from './constants'
import { Store, StoreActions, type State } from 'src/store'
import type { AlgodConfig, NetworkConfigMap, NetworkConstructor } from './types'

export class Network {
  private config: NetworkConfigMap
  private _algodClient: algosdk.Algodv2
  protected store: Store<State>
  protected notifySubscribers: () => void

  public subscribe: (callback: (state: State) => void) => () => void

  constructor({ config, store, subscribe, onStateChange }: NetworkConstructor) {
    this.config = config
    this.store = store
    this.subscribe = subscribe
    this.notifySubscribers = onStateChange
    this._algodClient = this.createAlgodClient(config[this.activeNetwork])
  }

  public setActiveNetwork(id: NetworkId): void {
    console.info(`[Network] Set active network: ${id}`)
    this.store.dispatch(StoreActions.SET_ACTIVE_NETWORK, { networkId: id })
    this._algodClient = this.createAlgodClient(this.config[id])

    this.notifySubscribers()
  }

  public get activeNetwork(): NetworkId {
    const state = this.store.getState()
    return state.activeNetwork
  }

  public get algodClient(): algosdk.Algodv2 {
    return this._algodClient
  }

  public get blockExplorer(): string {
    return blockExplorer[this.activeNetwork]
  }

  public get chainId(): string | undefined {
    return caipChainId[this.activeNetwork]
  }

  private createAlgodClient = (config: AlgodConfig): algosdk.Algodv2 => {
    console.info(`[Network] Creating Algodv2 client for ${this.activeNetwork}...`)
    const { token = '', baseServer, port = '', headers = {} } = config
    return new algosdk.Algodv2(token, baseServer, port, headers)
  }
}
