import { IOContext, InstanceOptions, JanusClient } from '@vtex/api'

interface SendMailProps {
  templateName: string
  jsonData: {
    url: string
  }
}

const ROUTES = {
  sendMail: '/api/mail-service/pvt/sendmail',
}

export default class Mail extends JanusClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super(context, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Proxy-Authorization': context.authToken,
        Authorization: context.authToken,
        VtexIdclientAutCookie: context.authToken,
      },
    })
  }

  public sendMail(mailData: SendMailProps): Promise<string> {
    return this.http.post(ROUTES.sendMail, mailData, {
      metric: 'mail-post-send',
    })
  }
}
