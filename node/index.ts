import { PaymentProviderService } from '@vtex/payment-provider'
import { method } from '@vtex/api'

import GetnetConnector from './connector'
import { Clients } from './clients'
import { getnetMailApprove } from './middlewares/getnetMailApprove'

export default new PaymentProviderService({
  clients: {
    implementation: Clients,
    options: {
      default: {
        retries: 2,
        timeout: 20000,
      },
    },
  },
  connector: GetnetConnector,
  routes: {
    getnetMailApprove: method({
      GET: [getnetMailApprove],
    }),
  },
})
