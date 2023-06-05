import { PaymentProviderService } from '@vtex/payment-provider'

import GetnetConnector from './connector'
import { Clients } from './clients'

export default new PaymentProviderService({
  clients: {
    implementation: Clients,
    options: {
      default: {
        retries: 2,
        timeout: 15000,
      },
    },
  },
  connector: GetnetConnector,
})
