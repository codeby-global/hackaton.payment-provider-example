/* eslint-disable @typescript-eslint/camelcase */
import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'
import { OrderDetailResponse } from '@vtex/clients'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

const GETNET_BASE_URL = 'https://api-homologacao.getnet.com.br'

const ROUTES = {
  auth: `/auth/oauth/v2/token?grant_type=client_credentials`,
  payments: `/v2/payments`,
  getPayment: (paymentId: string) => `/v1/payments/info/${paymentId}`,
  capture: `/v2/payments/capture`,
  cancel: `/v2/payments/cancel`,
}

export default class Getnet extends ExternalClient {
  private authToken: string | undefined

  constructor(protected context: IOContext, options?: InstanceOptions) {
    super(GETNET_BASE_URL, context, options)
  }

  private async auth(settings: AppSettings): Promise<GetnetAuthResponse> {
    const { getnetTransationalClientId, getnetTransationalSecretId } = settings

    const authToken = `${getnetTransationalClientId}:${getnetTransationalSecretId}`

    const authTokenBase64 = Buffer.from(authToken).toString('base64')

    // eslint-disable-next-line no-console
    console.log('====> authTokenBase64', authTokenBase64)

    const authResponse = await this.http.post<any>(ROUTES.auth, null, {
      headers: {
        Authorization: `Basic ${authTokenBase64}`,
      },
    })

    this.authToken = authResponse.access_token

    return authResponse
  }

  public async getPayment({
    settings,
    paymentId,
  }: {
    settings: AppSettings
    paymentId: string
  }) {
    if (!this.authToken) {
      await this.auth(settings)
    }

    return this.http.get(ROUTES.getPayment(paymentId), {
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
  }

  public async payment({
    settings,
    authorization,
    orderData,
    paymentId,
  }: {
    settings: AppSettings
    authorization: any
    orderData: OrderDetailResponse
    paymentId: string
  }): Promise<any | null> {
    if (!this.authToken) {
      await this.auth(settings)
    }

    const payload = {
      idempotency_key: uuidv4(),
      request_id: uuidv4(),
      order_id: orderData.orderId,
      data: {
        amount: orderData.value * 100,
        currency: orderData.storePreferencesData.currencyCode,
        customer_id: orderData.clientProfileData.userProfileId,
        payment: {
          payment_id: paymentId,
          payment_method: 'CREDIT_AUTHORIZATION',
          save_card_data: false,
          transaction_type: 'FULL',
          number_installments: 1,
          soft_descriptor: 'LOJA*TESTE*COMPRA-123',
          dynamic_mcc: 1799,
          card: {
            number: authorization.card.numberToken,
            expiration_month: authorization.card.expiration.month,
            expiration_year: authorization.card.expiration.year,
            cardholder_name: `${authorization.miniCart.buyer.firstName} ${authorization.miniCart.buyer.lastName}`,
            security_code: authorization.card.cscToken,
            brand: authorization.paymentMethod,
          },
        },
        sub_merchant: {
          identification_code: 9058345,
          document_type: 'CNPJ',
          document_number: 77415914000148,
          address: 'Torre Negra, 207',
          city: 'Cidade',
          state: 'RS',
          postal_code: 90520000,
        },
        additional_data: {
          split: {
            subseller_list_payment: [
              {
                subseller_id: 'HACKKKK',
                document_type: 'CNPJ',
                document_number: '12345678912',
                subseller_sale_amount: 118708,
                items: [
                  {
                    id: 'MR1',
                    description: 'Produto MR1.',
                    amount: 118708,
                    transaction_rate_percent: 1.2,
                  },
                ],
              },
            ],
          },
          customer: {
            first_name: orderData.clientProfileData.firstName,
            last_name: orderData.clientProfileData.lastName,
            name: `${orderData.clientProfileData.firstName} ${orderData.clientProfileData.lastName}`,
            document_type: orderData.clientProfileData.documentType,
            document_number: orderData.clientProfileData.document,
            email: orderData.clientProfileData.email,
            phone_number: orderData.clientProfileData.phone,
          },
        },
      },
    }

    try {
      return axios.post(authorization.secureProxyUrl, payload, {
        headers: {
          'X-PROVIDER-Forward-Authorization': `Bearer ${this.authToken}`,
          'X-PROVIDER-Forward-To': `${GETNET_BASE_URL}${ROUTES.payments}`,
          'X-PROVIDER-Forward-Content-Type': 'application/json',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(err, null, 2))
    }
  }

  public async capture(paymentId: string, settings: AppSettings): Promise<any> {
    if (!this.authToken) {
      await this.auth(settings)
    }

    return this.http.post(
      ROUTES.cancel,
      {
        idempotency_key: uuidv4(),
        payment_id: paymentId,
        payment_method: 'CREDIT_AUTHORIZATION',
      },
      {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          'Content-type': 'application/json; charset=utf-8',
        },
        metric: 'connectorAdyen-cancel',
      }
    )
  }

  public async cancel(
    paymentId: string,
    settings: AppSettings
  ): Promise<any | null> {
    if (!this.authToken) {
      await this.auth(settings)
    }

    return this.http.post(
      ROUTES.cancel,
      {
        idempotency_key: uuidv4(),
        payment_id: paymentId,
        payment_method: 'CREDIT_AUTHORIZATION',
      },
      {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          'Content-type': 'application/json; charset=utf-8',
        },
        metric: 'connectorAdyen-cancel',
      }
    )
  }

  /*
  public async refund({
    pspReference,
    data,
    settings,
  }: AdyenRefundRequest): Promise<AdyenRefundResponse | null> {
    return this.http.post(
      `/v67/payments/${pspReference}/refunds
    `,
      data,
      {
        headers: {
          'X-API-Key': settings.getnetTransationalClientId,
          'X-Vtex-Use-Https': 'true',
          'Content-Type': 'application/json',
        },
        metric: 'connectorAdyen-refund',
      }
    )
  }
  */
}
