import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'

const GETNET_BASE_URL = 'https://api-homologacao.getnet.com.br'

const ROUTES = {
  auth: (clientCredentials: string) =>
    `/auth/oauth/v2/token?grant_type=${clientCredentials}`,
  verifyCard: `/v1/cards/verification`,
}

export default class Getnet extends ExternalClient {
  constructor(protected context: IOContext, options?: InstanceOptions) {
    super(GETNET_BASE_URL, context, options)
  }

  private async auth(settings: AppSettings): Promise<GetnetAuthResponse> {
    const { getnetTransationalClientId, getnetTransationalSecretId } = settings

    const authToken = `${getnetTransationalClientId}:${getnetTransationalSecretId}`

    const authTokenBase64 = Buffer.from(authToken).toString('base64')

    return this.http.post(ROUTES.auth(authTokenBase64))
  }

  public async capture({ data, settings }: any): Promise<any | null> {
    const { access_token: accessToken } = await this.auth(settings)

    return this.http.post(ROUTES.verifyCard, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-type': 'application/json; charset=utf-8',
      },
    })
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

  public async payment(_: any): Promise<any> {
    return null
  }

  public async buildPaymentRequest(_: any): Promise<any> {
    return null
  }
}
