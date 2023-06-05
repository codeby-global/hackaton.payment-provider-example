/* eslint-disable @typescript-eslint/camelcase */
import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'

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

  public async payment({ settings }: any): Promise<any | null> {
    const { access_token: accessToken } = await this.auth(settings)

    return this.http.post(
      ROUTES.payments,
      {
        idempotency_key: '1eb2412c-165a-41cd-b1d9-76c575d70a21',
        request_id: '20bde238-08f5-41a8-9925-8095b1b1db76',
        order_id: '63c7f8ee-51a6-470d-bb76-ef762b62bfb7',
        data: {
          amount: 118708,
          currency: 'BRL',
          customer_id: 'teste',
          payment: {
            payment_id: '173f9e8d-4e0b-4503-8016-5cdafba89bee',
            payment_method: 'CREDIT',
            save_card_data: false,
            transaction_type: 'FULL',
            number_installments: 1,
            soft_descriptor: 'LOJA*TESTE*COMPRA-123',
            dynamic_mcc: 1799,
            card: {
              number: 5155901222280001,
              expiration_month: '09',
              expiration_year: 30,
              cardholder_name: 'Roland Deschain',
              security_code: 517,
              brand: 'Visa',
              number_token:
                'e71084449bc70e344f77d4c382704ea2868b5e9775dced7ffcd40b3f66b167f51e352a2f289b518a11180c81478dfbdbeffd8a41f0b34564f2f0e41be8a88e11',
            },
            tokenization: {
              type: 'TAVV',
              cryptogram: '0006010865799300000620111679930000000000',
              eci: '00',
              requestor_id: 1234567,
            },
            wallet: {
              type: '55',
              id: '000',
              merchant_id: '327',
              fund_transfer: {
                pay_action: 'FT',
                receiver: {
                  account_number: '9999999999999995',
                  account_type: '00',
                  first_name: 'Jane',
                  middle_name: 'T',
                  last_name: 'Smith',
                  addr_street: '1 Main ST',
                  addr_city: 'SAO PAULO',
                  addr_state: 'SP',
                  addr_country: 'BRA',
                  addr_postal_code: '1408000',
                  nationality: 'BRA',
                  phone: '5511977778888',
                  date_of_birth: '19901230',
                  id_type: '03',
                  id_num: '12345678900000',
                },
              },
            },
            xid: 'teste',
            ucaf: 'string',
            eci: '00',
            tdsdsxid: 'string',
            tdsver: '2.1.0',
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
                  subseller_id: '700104158',
                  document_type: 'CNPJ',
                  document_number: '12345678912',
                  subseller_sale_amount: 118708,
                  items: [
                    {
                      id: 'MR1',
                      description: 'Produto MR1.',
                      amount: 118708,
                      transaction_rate_percent: 1.2,
                      transaction_rate_amount: 235,
                      payment_plan: 3,
                    },
                  ],
                },
              ],
            },
            device: {
              ip_address: '10.0.0.1',
              device_id: 'ae44e06c-3e85-44af-8542-bcaccd54ef2e',
            },
            customer: {
              first_name: 'João',
              last_name: 'da Silva',
              name: 'João da Silva',
              document_type: 'CPF',
              document_number: '12345678912',
              email: 'customer@email.com.br',
              phone_number: '5551999887766',
            },
            billing_address: {
              street: 'Av. Brasil',
              number: '1000',
              complement: 'Sala 1',
              district: 'São Geraldo',
              city: 'Porto Alegre',
              state: 'RS',
              country: 'Brasil',
              postal_code: '90230060',
            },
            shippings: {
              address: {
                street: 'Av. Brasil',
                number: '1000',
                complement: 'Sala 1',
                district: 'São Geraldo',
                city: 'Porto Alegre',
                state: 'RS',
                country: 'Brasil',
                postal_code: '90230060',
              },
            },
            order: {
              items: [
                {
                  name: 'Copo térmico 473ML preto Stanley',
                  price: 139.9,
                  quantity: 1,
                  sku: 'XXX-00-XXX-00',
                },
              ],
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
