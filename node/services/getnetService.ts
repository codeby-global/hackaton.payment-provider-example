import {
  AuthorizationRequest,
  CardAuthorization,
  RefundRequest,
  SettlementRequest,
  TokenizedCard,
} from '@vtex/payment-provider'
import { ServiceContext } from '@vtex/api'

import { priceInCents } from '../utils/priceInCents'
import { Clients } from '../clients'

const APP_ID = process.env.VTEX_APP_ID as string

const handleSplit = async (
  ctx: ServiceContext<Clients>,
  authorization: AuthorizationRequest | RefundRequest | SettlementRequest
) => {
  if (!authorization.recipients) return undefined

  const { recipients } = authorization

  if (!recipients.length) return undefined

  const {
    // clients: { platforms },
    vtex: { logger },
  } = ctx

  const sellerIds = recipients.map(recipient => recipient.id)
  const accounts: any = null

  try {
    // accounts = await platforms.getAccounts(ctx, sellerIds)
  } catch (error) {
    logger.error({
      error,
      message: 'connectorGetnet-getAccountsRequestError',
      data: { sellerIds },
    })
  }

  if (!accounts) {
    logger.warn({
      message: 'connectorGetnet-NoSplitAccountsReturned',
      data: { recipients },
    })

    return undefined
  }

  const splits = recipients.reduce((prev, cur) => {
    const detail = {
      amount: {
        value: priceInCents(cur.amount),
      },
      type: 'Default',
      reference: cur.name,
    }

    if (cur.role === 'seller') {
      prev.push({
        ...detail,
        type: 'MarketPlace',
        account: accounts.find((i: any) => i.sellerId === cur.id).accountCode,
      })
    }

    if (cur.role === 'marketplace') {
      prev.push(detail)
    }

    return prev
  }, [] as any[])

  return splits
}

export const getnetService = {
  buildPaymentRequest: async ({
    ctx,
    authorization,
    settings,
  }: {
    ctx: ServiceContext<Clients>
    authorization: AuthorizationRequest
    settings: AppSettings
  }): Promise<any> => {
    const {
      value,
      currency,
      paymentId,
      returnUrl,
      ipAddress,
      secureProxyUrl,
      card,
      miniCart: { buyer, billingAddress, shippingAddress },
    } = authorization as CardAuthorization

    const {
      numberToken: number,
      holderToken: holderName,
      cscToken: cvc,
      expiration: { month: expiryMonth, year: expiryYear },
    } = card as TokenizedCard

    const paymentMethod = {
      type: 'scheme',
      number,
      expiryMonth,
      expiryYear,
      cvc,
      holderName,
    }

    const splits = await handleSplit(ctx, authorization)

    const data = {
      paymentMethod,
      amount: { value: priceInCents(value), currency },
      reference: paymentId,
      returnUrl: returnUrl ?? '',
      splits,
      shopperEmail: buyer.email,
      shopperIP: ipAddress,
      billingAddress: {
        city: billingAddress?.city,
        country: 'ZZ',
        houseNumberOrName: billingAddress?.number ?? '',
        postalCode: billingAddress?.postalCode ?? '',
        stateOrProvince: billingAddress?.state ?? '',
        street: billingAddress?.street ?? '',
      },
      deliveryAddress: {
        city: shippingAddress?.city,
        country: 'ZZ',
        houseNumberOrName: shippingAddress?.number ?? '',
        postalCode: shippingAddress?.postalCode ?? '',
        stateOrProvince: shippingAddress?.state ?? '',
        street: shippingAddress?.street ?? '',
      },
      browserInfo: {
        language: 'en-EN',
      },
      redirectToIssuerMethod: 'GET',
    }

    return {
      data,
      settings,
      secureProxyUrl,
    }
  },
  buildRefundRequest: async ({
    ctx,
    refund,
    authorization,
  }: {
    ctx: ServiceContext<Clients>
    refund: RefundRequest
    authorization: any
  }): Promise<any> => {
    const {
      pspReference,
      amount: { currency },
    } = authorization.notificationItems[0].NotificationRequestItem

    const settings: AppSettings = await ctx.clients.apps.getAppSettings(APP_ID)
    const splits = await handleSplit(ctx, refund)

    const data = {
      amount: { value: priceInCents(refund.value), currency },
      reference: `${refund.paymentId}-${refund.value}`,
      splits,
    }

    return {
      pspReference, // refund.tid
      data,
      settings,
    }
  },
  buildCaptureRequest: async ({
    ctx,
    settlement,
    authorization,
  }: {
    ctx: ServiceContext<Clients>
    settlement: SettlementRequest
    authorization: any
  }): Promise<any> => {
    const {
      pspReference,
      amount: { currency },
    } = authorization.notificationItems[0].NotificationRequestItem

    const settings: AppSettings = await ctx.clients.apps.getAppSettings(APP_ID)
    const splits = await handleSplit(ctx, settlement)

    const data = {
      amount: { value: priceInCents(settlement.value), currency },
      reference: `${settlement.paymentId}-${settlement.value}`,
      splits,
    }

    return {
      pspReference, // refund.tid
      data,
      settings,
    }
  },
}
