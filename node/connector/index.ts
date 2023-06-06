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

import { randomString } from '../utils/utils'
import { executeAuthorization } from '../flow'
import {
  getPersistedAuthorizationResponse,
  persistAuthorizationResponse,
} from '../utils/vbaseFunctions'
import { Clients } from '../clients'
import {
  GETNET_AUTHORIZATION_BUCKET,
  GETNET_CANCELLATION_BUCKET,
  GETNET_CAPTURE_BUCKET,
  // GETNET_REFUND_BUCKET,
  GETNET_REQUEST_BUCKET,
} from '../utils/constants'
// import { getnetService } from '../services/getnetService'

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
      clients: { getnet, vbase, oms },
      vtex: { logger },
    } = this.context

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

    const orderData = await oms.order(`${authorization.orderId}-01`)

    if (!orderData) {
      return Authorizations.deny(authorization, {
        message: 'Order not found',
      })
    }

    const settings = await this.getAppSettings()

    const paymentData = await getnet.payment({
      settings,
      authorization,
      orderData,
      paymentId: authorization.transactionId,
    })

    // eslint-disable-next-line no-console
    console.log('===========> paymentData', paymentData)

    const getnetResponse = await getnet.getPayment({
      settings,
      paymentId: paymentData.payment_id,
    })

    // eslint-disable-next-line no-console
    console.log('===========> getnetResponse', getnetResponse)

    if (!getnetResponse) {
      return Authorizations.deny(authorization as CardAuthorization, {
        message: 'No Getnet Payment response',
      })
    }

    const {
      status,
      records,
      payment_id: paymentId,
      message,
      payment,
      details,
    } = getnetResponse

    if (records[0] && records[0].href) {
      return {
        paymentId: authorization.paymentId,
        status: 'undefined',
        redirectUrl: records[0].href,
      } as RedirectResponse
    }

    if (status === 'APPROVED') {
      return Authorizations.approveCard(authorization as CardAuthorization, {
        tid: paymentId,
        authorizationId: payment.payment_id,
      })
    }

    if (details[0] && ['DENIED', 'ERROR'].includes(details[0].status)) {
      return Authorizations.deny(authorization as CardAuthorization, {
        tid: paymentId,
        message,
      })
    }

    return {
      paymentId: authorization.paymentId,
      status: 'undefined',
      tid: paymentId,
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

    const {
      clients: { getnet, vbase },
      vtex: { logger },
    } = this.context

    const existingCancellation = await vbase.getJSON<any | null>(
      GETNET_CANCELLATION_BUCKET,
      cancellation.paymentId,
      TRUE_NULL_IF_NOT_FOUND
    )

    logger.info({
      message: 'connectorGetnet-cancelRequest',
      data: { cancellation, existingCancellation },
    })

    if (existingCancellation) {
      if (existingCancellation.notification) {
        const [
          {
            NotificationRequestItem: {
              pspReference,
              eventCode,
              reason,
              success,
            },
          },
        ] = existingCancellation.notification.notificationItems

        if (success === 'true') {
          return Cancellations.approve(cancellation, {
            cancellationId: pspReference,
          })
        }

        return Cancellations.deny(cancellation, {
          code: eventCode,
          message: reason,
        })
      }

      return {
        ...cancellation,
        cancellationId: null,
        code: null,
        message: null,
      }
    }

    vbase.saveJSON<any>(GETNET_CANCELLATION_BUCKET, cancellation.paymentId, {
      notification: null,
    })

    if (!cancellation.authorizationId) {
      logger.error({
        message: 'connectorGetnet-authorizationIdMissing',
        data: { cancellation },
      })

      throw new Error('Transaction not found')
    }

    const settings = await this.getAppSettings()

    try {
      await getnet.cancel(cancellation.transactionId, settings)
    } catch (error) {
      logger.error({
        error,
        message: 'connectorGetnet-getnetCancelRequestError',
        data: {
          pspReference: cancellation.authorizationId,
          request: {
            merchantAccount: settings.getnetTransationalClientId,
            reference: cancellation.paymentId,
          },
        },
      })
    }

    return {
      ...cancellation,
      cancellationId: null,
      code: null,
      message: null,
    }
  }

  public async refund(refund: RefundRequest): Promise<RefundResponse> {
    if (this.isTestSuite) {
      return Refunds.deny(refund)
    }

    throw new Error('Method not implemented!')

    /*
    const {
      clients: { getnet, vbase },
      vtex: { logger },
    } = this.context

    const existingRefund = await vbase.getJSON<any | null>(
      GETNET_REFUND_BUCKET,
      `${refund.paymentId}-${refund.value}`,
      TRUE_NULL_IF_NOT_FOUND
    )

    logger.info({
      message: 'connectorGetnet-refundRequest',
      data: { refund, existingRefund },
    })

    if (existingRefund) {
      if (existingRefund.notification) {
        const [
          {
            NotificationRequestItem: {
              pspReference,
              eventCode,
              reason,
              success,
            },
          },
        ] = existingRefund.notification.notificationItems

        if (success === 'true') {
          return Refunds.approve(refund, {
            refundId: pspReference,
          })
        }

        return Refunds.deny(refund, {
          code: eventCode,
          message: reason,
        })
      }

      return {
        ...refund,
        refundId: null,
        code: null,
        message: null,
      }
    }

    vbase.saveJSON<any>(
      GETNET_REFUND_BUCKET,
      `${refund.paymentId}-${refund.value}`,
      { notification: null }
    )

    const getnetAuth = await vbase.getJSON<any | null>(
      GETNET_AUTHORIZATION_BUCKET,
      refund.paymentId,
      TRUE_NULL_IF_NOT_FOUND
    )

    if (!getnetAuth) {
      logger.error({
        message: 'connectorGetnet-refundError-GetnetAuthNotFound',
        data: { refund },
      })

      throw new Error('Missing transaction data')
    }

    const refundRequest = await getnetService.buildRefundRequest({
      ctx: this.context,
      refund,
      authorization: getnetAuth,
    })

    try {
      await getnet.refund(refundRequest)
    } catch (error) {
      logger.error({
        error,
        message: 'connectorGetnetRefundTequestError',
        data: {
          pspReference: refundRequest.pspReference,
          request: refundRequest.data,
        },
      })
    }

    return {
      ...refund,
      refundId: null,
      code: null,
      message: null,
    }
    */
  }

  public async settle(
    settlement: SettlementRequest
  ): Promise<SettlementResponse> {
    if (this.isTestSuite) {
      return Settlements.deny(settlement)
    }

    const {
      clients: { getnet, vbase },
      vtex: { logger },
    } = this.context

    const existingSettlement = await vbase.getJSON<any | null>(
      GETNET_CAPTURE_BUCKET,
      `${settlement.paymentId}-${settlement.value}`,
      TRUE_NULL_IF_NOT_FOUND
    )

    logger.info({
      message: 'connectorGetnet-settleRequest',
      data: { settlement, existingSettlement },
    })

    if (existingSettlement) {
      if (existingSettlement.notification) {
        const [
          {
            NotificationRequestItem: {
              pspReference,
              eventCode,
              reason,
              success,
            },
          },
        ] = existingSettlement.notification.notificationItems

        if (success === 'true') {
          return Settlements.approve(settlement, {
            settleId: pspReference,
          })
        }

        return Settlements.deny(settlement, {
          code: eventCode,
          message: reason,
        })
      }

      return {
        ...settlement,
        code: null,
        message: null,
        settleId: null,
      }
    }

    vbase.saveJSON<any>(
      GETNET_CAPTURE_BUCKET,
      `${settlement.paymentId}-${settlement.value}`,
      { notification: null }
    )

    const getnetAuth = await vbase.getJSON<any | null>(
      GETNET_AUTHORIZATION_BUCKET,
      settlement.paymentId,
      TRUE_NULL_IF_NOT_FOUND
    )

    if (!getnetAuth) {
      logger.error({
        message: 'connectorGetnet-settleError-getnetAuthNotFound',
        data: { settlement, getnetAuth },
      })

      throw new Error('Missing transaction data')
    }

    const settings = await this.getAppSettings()

    try {
      await getnet.capture(settlement.paymentId, settings)
    } catch (error) {
      logger.error({
        error,
        message: 'connectorGetnet-getnetSettleRequestError',
        data: {
          pspReference: settlement.authorizationId,
          request: settlement.paymentId,
        },
      })
    }

    return {
      ...settlement,
      code: null,
      message: null,
      settleId: null,
    }
  }

  public inbound: undefined
}
