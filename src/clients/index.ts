import { BaseClient } from './base'
import { ExodusClient } from './exodus'
import { PeraClient } from './pera'
import { WALLET_ID } from 'src/constants'

export type ClientMap = {
  [WALLET_ID.EXODUS]: typeof ExodusClient
  [WALLET_ID.PERA]: typeof PeraClient
}

function createClientMap(): ClientMap {
  return {
    [WALLET_ID.EXODUS]: ExodusClient,
    [WALLET_ID.PERA]: PeraClient
  }
}

const clients = createClientMap()

export { clients, BaseClient, ExodusClient, PeraClient }
