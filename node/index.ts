import { PaymentProviderService } from '@vtex/payment-provider'

import VtexHackatonConnector from './connector'

export default new PaymentProviderService({
  connector: VtexHackatonConnector,
})
