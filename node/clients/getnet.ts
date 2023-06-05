import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'

const GETNET_BASE_URL = 'https://api-homologacao.getnet.com.br/v1/mgm/'

export default class Getnet extends ExternalClient {
  constructor(protected context: IOContext, options?: InstanceOptions) {
    super(GETNET_BASE_URL, context, options)
  }

  public async capture({
    pspReference,
    data,
    settings,
  }: any): Promise<AdyenCaptureResponse | null> {
    return this.http.post(
      `/v67/payments/${pspReference}/captures
        `,
      data,
      {
        headers: {
          'X-API-Key': settings.getnetBackofficeClientId,
          'X-Vtex-Use-Https': 'true',
          'Content-Type': 'application/json',
        },
        metric: 'connectorAdyen-capture',
      }
    )
  }

  public async cancel(
    pspReference: string,
    data: AdyenCancelRequest,
    appSettings: AppSettings
  ): Promise<AdyenCancelResponse | null> {
    return this.http.post(`/v67/payments/${pspReference}/cancels`, data, {
      headers: {
        'X-API-Key': appSettings.getnetBackofficeClientId,
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
          'X-API-Key': settings.getnetBackofficeClientId,
          'X-Vtex-Use-Https': 'true',
          'Content-Type': 'application/json',
        },
        metric: 'connectorAdyen-refund',
      }
    )
  }
}
