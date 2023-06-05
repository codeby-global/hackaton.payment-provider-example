/* eslint-disable @typescript-eslint/camelcase */
import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'
import { OrderDetailResponse } from '@vtex/clients'
import { AuthorizationRequest } from '@vtex/payment-provider'
import { v4 as uuidv4 } from 'uuid'

const GETNET_BASE_URL = 'https://api-homologacao.getnet.com.br'

const ROUTES = {
  auth: `/auth/oauth/v2/token?grant_type=client_credentials`,
  payments: `/v2/payments`,
}

export default class Getnet extends ExternalClient {
  constructor(protected context: IOContext, options?: InstanceOptions) {
    super(GETNET_BASE_URL, context, options)
  }

  private async auth(settings: AppSettings): Promise<GetnetAuthResponse> {
    const { getnetTransationalClientId, getnetTransationalSecretId } = settings

    const authToken = `${getnetTransationalClientId}:${getnetTransationalSecretId}`

    const authTokenBase64 = Buffer.from(authToken).toString('base64')

    return this.http.post(ROUTES.auth, null, {
      headers: {
        Authorization: `Basic ${authTokenBase64}`,
      },
    })
  }

  public async payment({
    settings,
    authorization,
    orderData,
  }: {
    settings: AppSettings
    authorization: AuthorizationRequest
    orderData: OrderDetailResponse
  }): Promise<any | null> {
    const { access_token: accessToken } = await this.auth(settings)

    return this.http.post(
      ROUTES.payments,
      {
        idempotency_key: uuidv4(),
        request_id: 'ANY REQUEST ID',
        order_id: orderData.orderId,
        data: {
          amount: orderData.value * 100,
          currency: orderData.storePreferencesData.currencyCode,
          customer_id: orderData.clientProfileData.userProfileId,
          payment: {
            payment_id: authorization.transactionId,
            payment_method: 'CREDIT_AUTHORIZATION',
            save_card_data: false,
            transaction_type: 'FULL',
            number_installments: 1,
            soft_descriptor: 'LOJA*TESTE*COMPRA-123',
            dynamic_mcc: 1799,
            card: {
              number: 4012001037141112,
              expiration_month: '09',
              expiration_year: 30,
              cardholder_name: 'Roland Deschain',
              security_code: 517,
              brand: 'Visa',
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
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-type': 'application/json; charset=utf-8',
        },
      }
    )
  }

  /*
  public async cancel(
    pspReference: string,
    data: AdyenCancelRequest,
    appSettings: AppSettings
  ): Promise<AdyenCancelResponse | null> {
    return this.http.post(`/v67/payments/${pspReference}/cancels`, data, {
      headers: {
        'X-API-Key': appSettings.getnetTransationalClientId,
        'X-Vtex-Use-Https': 'true',
        'Content-Type': 'application/json',
      },
      metric: 'connectorAdyen-cancel',
    })
  }

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

  public async buildPaymentRequest(_: any): Promise<any> {
    /*
    const {
      paymentMethod: brand,
      miniCart: {
        buyer: { firstName, lastName },
      },
      card: {
        // holderToken,
        // numberToken,
        // numberLength,
        // cscToken,
        // cscLength,
        expiration: { month: expiration_month, year: expiration_year },
      },
    } = authorization

    return {
      number_token: await this.generateCardToken({
        authorization,
        settings,
      }),
      brand,
      cardholder_name: `${firstName} ${lastName}`,
      expiration_month,
      expiration_year,
      security_code: '123',
    }
    */

    return {
      idempotency_key: '1eb2412c-165a-41cd-b1d9-76c575d70a211',
      request_id: '20bde238-08f5-41a8-9925-8095b1b1db761',
      order_id: '63c7f8ee-51a6-470d-bb76-ef762b62bfb71',
      data: {
        amount: 10000,
        currency: 'BRL',
        customer_id: 'teste',
        payment: {
          payment_method: 'CREDIT',
          transaction_type: 'FULL',
          number_installments: 1,
          card: {
            number: 5155901222280001,
            expiration_month: '09',
            expiration_year: 30,
            cardholder_name: 'Roland Deschain',
            security_code: 517,
            brand: 'Visa',
          },
        },
      },
    }
  }
}
