import type { ClientsConfig } from '@vtex/api'
import { IOClients, LRUCache } from '@vtex/api'
import Provider from './provider'

const TWO_RETRIES = 2
const TIMEOUT_MS = 15000

const defaultClientOptions = {
  retries: TWO_RETRIES,
  timeout: TIMEOUT_MS,
}

const cacheStorage = new LRUCache<string, any>({ max: 5000 })

// eslint-disable-next-line no-undef
metrics.trackCache('wordpressProxy', cacheStorage)

export class Clients extends IOClients {
  public get provider() {
    return this.getOrSet('provider', Provider)
  }
}

export const clients: ClientsConfig<Clients> = {
  implementation: Clients,
  options: {
    default: defaultClientOptions,
    wordpressProxy: {
      memoryCache: cacheStorage,
    },
  },
}
