import { PaymentProviderService } from '@vtex/payment-provider'

import GetnetConnector from './connector'

export default new PaymentProviderService({
  connector: GetnetConnector,
})
