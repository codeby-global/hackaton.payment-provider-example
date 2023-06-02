/* eslint-disable @typescript-eslint/consistent-type-imports */
import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'

const TEST_URL = 'http://checkout-test.adyen.com' as const

export default class Provider extends ExternalClient {
  constructor(protected context: IOContext, options?: InstanceOptions) {
    super('', context, options)
  }

  private getEndpoint(settings: any) {
    return this.context.production ? settings.productionAPI : TEST_URL
  }

  public async capture({
    pspReference,
    data,
    settings,
  }: any): Promise<AdyenCaptureResponse | null> {
    return this.http.post(
      `${this.getEndpoint(settings)}/v67/payments/${pspReference}/captures
        `,
      data,
      {
        headers: {
          'X-API-Key': settings.apiKey,
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
    return this.http.post(
      `${this.getEndpoint(appSettings)}/v67/payments/${pspReference}/cancels`,
      data,
      {
        headers: {
          'X-API-Key': appSettings.apiKey,
          'X-Vtex-Use-Https': 'true',
          'Content-Type': 'application/json',
        },
        metric: 'connectorAdyen-cancel',
      }
    )
  }

  public async refund({
    pspReference,
    data,
    settings,
  }: AdyenRefundRequest): Promise<AdyenRefundResponse | null> {
    return this.http.post(
      `${this.getEndpoint(settings)}/v67/payments/${pspReference}/refunds
    `,
      data,
      {
        headers: {
          'X-API-Key': settings.apiKey,
          'X-Vtex-Use-Https': 'true',
          'Content-Type': 'application/json',
        },
        metric: 'connectorAdyen-refund',
      }
    )
  }
}
