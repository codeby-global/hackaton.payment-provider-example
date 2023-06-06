import { ClientsConfig, IOClients, LRUCache } from '@vtex/api'
import { OMS, vbaseFor } from '@vtex/clients'

import Getnet from './getnet'
import {
  GETNET_AUTHORIZATION_BUCKET,
  GETNET_CANCELLATION_BUCKET,
  GETNET_CAPTURE_BUCKET,
  GETNET_REFUND_BUCKET,
  GETNET_REQUEST_BUCKET,
} from '../utils/constants'

const TWO_RETRIES = 2
const TIMEOUT_MS = 20000

const defaultClientOptions = {
  retries: TWO_RETRIES,
  timeout: TIMEOUT_MS,
}

const cacheStorage = new LRUCache<string, any>({ max: 5000 })

// eslint-disable-next-line no-undef
metrics.trackCache('wordpressProxy', cacheStorage)

const GetnetAuth = vbaseFor<string, any>(GETNET_AUTHORIZATION_BUCKET)
const GetnetRequest = vbaseFor<string, any>(GETNET_REQUEST_BUCKET)
const GetnetCancellation = vbaseFor<string, any>(GETNET_CANCELLATION_BUCKET)
const GetnetRefund = vbaseFor<string, any>(GETNET_REFUND_BUCKET)
const GetnetCapture = vbaseFor<string, any>(GETNET_CAPTURE_BUCKET)

export class Clients extends IOClients {
  public get getnet() {
    return this.getOrSet('getnet', Getnet)
  }

  public get getnetAuth() {
    return this.getOrSet('getnetAuth', GetnetAuth)
  }

  public get getnetRequest() {
    return this.getOrSet('getnetRequest', GetnetRequest)
  }

  public get getnetCancellation() {
    return this.getOrSet('getnetCancellation', GetnetCancellation)
  }

  public get getnetRefund() {
    return this.getOrSet('getnetRefund', GetnetRefund)
  }

  public get getnetCapture() {
    return this.getOrSet('getnetCapture', GetnetCapture)
  }

  public get oms() {
    return this.getOrSet('oms', OMS)
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
