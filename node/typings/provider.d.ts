interface AdyenHookNotification {
  live: 'true' | 'false'
  notificationItems: [
    {
      NotificationRequestItem: {
        amount: {
          currency: string
          value: number
        }
        eventCode: EventCode
        eventDate: string
        merchantAccountCode: string
        merchantReference: string
        originalReference: string
        paymentMethod: string
        pspReference: string
        reason: string
        success: 'true' | 'false'
      }
    }
  ]
}

interface TransactionEvent {
  notification: AdyenHookNotification | null
}

type EventCode =
  | 'CAPTURE'
  | 'CAPTURE_FAILED'
  | 'REFUND'
  | 'CANCELLATION'
  | 'AUTHORISATION'

interface AdyenPaymentResponse {
  action?: Action
  additionalData?: any
  amount: Amount
  donationToken?: string
  fraudResult?: any
  merchantReference: string
  order?: any
  pspReference: string
  refusalReason?: string
  refusalReasonCode?: string
  resultCode: ResultCode
  threeDS2Result?: any
}

type ResultCode =
  | 'AuthenticationFinished'
  | 'AuthenticationNotRequired'
  | 'Authorised'
  | 'Cancelled'
  | 'ChallengeShopper'
  | 'Error'
  | 'IdentifyShopper'
  | 'Pending'
  | 'PresentToShopper'
  | 'Received'
  | 'RedirectShopper'
  | 'Refused'
type Action = CheckoutAwaitAction

interface CheckoutAwaitAction {
  paymentData: string
  paymentMethodType: string
  type: 'await'
  url: string
}

interface AdyenPayment {
  merchantAccount: string
  amount: Amount
  reference: string
  paymentMethod: PaymentMethod
  returnUrl: string
}

interface Amount {
  currency: string
  value: number
}

interface PaymentType {
  type: string
}

interface AdyenCard extends PaymentType {
  encryptedCardNumber: string
  encryptedExpiryMonth: string
  encryptedExpiryYear: string
  encryptedSecurityCode: string
  holderName?: string
}

type PaymentMethod = AdyenCard | PaymentType

interface AdyenModificationRequest {
  merchantAccount: string
  originalReference: string
  additionalData?: any
  mpiData?: any
  originalMerchantReference?: string
  reference?: string
  splits?: Split[]
  tenderReference?: string
  uniqueTerminalId?: string
}

interface AdyenCaptureRequest {
  amount: Amount
  merchantAccount: string
  reference?: string
  splits?: Split[]
}

interface AdyenCancelRequest {
  merchantAccount: string
  reference?: string
}

interface AdyenPaymentRequest {
  data: AdyenPayment
  settings: AppSettings
  secureProxyUrl: string | undefined
}

interface AdyenRefundRequest {
  pspReference: string
  data: AdyenRefund
  settings: AppSettings
}

interface AdyenRefund {
  amount: Amount
  merchantAccount: string
  reference?: string
  splits?: Split[]
}

interface AdyenSplit {
  account?: string
  amount: Amount
  description?: string
  reference?: string
  type: string
}

interface AdyenCaptureResponse {
  amount: Amount
  merchantAccount: string
  paymentPspReference: string
  pspReference: string
  reference?: string
  splits?: Split[]
  status: 'received'
}

interface AdyenRefundResponse {
  amount: Amount
  merchantAccount: string
  paymentPspReference: string
  pspReference: string
  reference?: string
  status: 'received'
}

interface AdyenCancelResponse {
  merchantAccount: string
  paymentPspReference: string
  pspReference: string
  reference?: string
  status: 'received'
}
