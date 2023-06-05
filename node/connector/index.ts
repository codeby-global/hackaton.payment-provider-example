import {
  AuthorizationRequest,
  AuthorizationResponse,
  Authorizations,
  CancellationRequest,
  CancellationResponse,
  Cancellations,
  CardAuthorization,
  PaymentProvider,
  PendingAuthorization,
  RedirectResponse,
  RefundRequest,
  RefundResponse,
  Refunds,
  SettlementRequest,
  SettlementResponse,
  Settlements,
  isCardAuthorization,
} from '@vtex/payment-provider'

import { randomString } from '../utils'
import { executeAuthorization } from '../flow'
import {
  getPersistedAuthorizationResponse,
  persistAuthorizationResponse,
} from '../utils/vbaseFunctions'
import { Clients } from '../clients'
import {
  GETNET_AUTHORIZATION_BUCKET,
  GETNET_REQUEST_BUCKET,
} from '../utils/constants'

const APP_ID = process.env.VTEX_APP_ID as string

const TRUE_NULL_IF_NOT_FOUND = true

export default class GetnetConnector extends PaymentProvider<Clients> {
  public async getAppSettings() {
    const {
      clients: { apps },
    } = this.context

    const settings: AppSettings = await apps.getAppSettings(APP_ID)

    return settings
  }

  private async saveAndRetry(
    req: AuthorizationRequest,
    resp: AuthorizationResponse
  ) {
    await persistAuthorizationResponse(this.context.clients.vbase, resp)
    this.callback(req, resp)
  }

  public async authorize(
    authorization: AuthorizationRequest
  ): Promise<AuthorizationResponse> {
    if (this.isTestSuite) {
      const persistedResponse = await getPersistedAuthorizationResponse(
        this.context.clients.vbase,
        authorization
      )

      if (persistedResponse !== undefined && persistedResponse !== null) {
        return persistedResponse
      }

      return executeAuthorization(authorization, response =>
        this.saveAndRetry(authorization, response)
      )
    }

    const {
      clients: { getnet, vbase },
      vtex: { logger },
    } = this.context

    const settings = await this.getAppSettings()
    const existingAuthorization = await vbase.getJSON<any | null>(
      GETNET_AUTHORIZATION_BUCKET,
      authorization.paymentId,
      TRUE_NULL_IF_NOT_FOUND
    )

    logger.info({
      message: 'connectorGetnet-paymentRequest',
      data: { authorization, existingAuthorization },
    })

    if (existingAuthorization) {
      const [
        {
          NotificationRequestItem: { pspReference, reason, success },
        },
      ] = existingAuthorization.notificationItems

      if (success === 'true') {
        return Authorizations.approveCard(authorization as CardAuthorization, {
          tid: pspReference,
          authorizationId: pspReference,
        })
      }

      if (success === 'false') {
        return Authorizations.deny(authorization, {
          message: reason,
        })
      }
    }

    if (!isCardAuthorization(authorization)) {
      return Authorizations.deny(authorization, {
        message: 'Payment method not supported',
      })
    }

    await vbase.saveJSON<AuthorizationRequest | null>(
      GETNET_REQUEST_BUCKET,
      authorization.paymentId,
      authorization
    )

    const getnetPaymentRequest = await getnet.buildPaymentRequest({
      ctx: this.context,
      authorization,
      settings,
    })

    let getnetResponse = null

    try {
      getnetResponse = await getnet.payment(getnetPaymentRequest)
    } catch (error) {
      logger.error({
        error,
        message: 'connectorGetnet-getnetPaymentRequestError',
        data: getnetPaymentRequest.data,
      })
    }

    if (!getnetResponse) {
      return Authorizations.deny(authorization as CardAuthorization, {
        message: 'No Getnet Payment response',
      })
    }

    const { resultCode, pspReference, refusalReason } = getnetResponse

    if (getnetResponse.action?.url) {
      return {
        paymentId: authorization.paymentId,
        status: 'undefined',
        redirectUrl: getnetResponse.action.url,
      } as RedirectResponse
    }

    if (['Error', 'Refused', 'Cancelled'].includes(resultCode)) {
      return Authorizations.deny(authorization as CardAuthorization, {
        tid: pspReference,
        message: refusalReason,
      })
    }

    return {
      paymentId: authorization.paymentId,
      status: 'undefined',
      tid: pspReference,
    } as PendingAuthorization
  }

  public async cancel(
    cancellation: CancellationRequest
  ): Promise<CancellationResponse> {
    if (this.isTestSuite) {
      return Cancellations.approve(cancellation, {
        cancellationId: randomString(),
      })
    }

    throw new Error('Not implemented')
  }

  public async refund(refund: RefundRequest): Promise<RefundResponse> {
    if (this.isTestSuite) {
      return Refunds.deny(refund)
    }

    throw new Error('Not implemented')
  }

  public async settle(
    settlement: SettlementRequest
  ): Promise<SettlementResponse> {
    if (this.isTestSuite) {
      return Settlements.deny(settlement)
    }

    throw new Error('Not implemented')
  }

  public inbound: undefined
}
