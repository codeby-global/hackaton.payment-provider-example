import { VBase } from '@vtex/api'
import {
  AuthorizationRequest,
  AuthorizationResponse,
} from '@vtex/payment-provider'

const authorizationsBucket = 'authorizations'

export const persistAuthorizationResponse = async (
  vbase: VBase,
  resp: AuthorizationResponse
) => vbase.saveJSON(authorizationsBucket, resp.paymentId, resp)

export const getPersistedAuthorizationResponse = async (
  vbase: VBase,
  req: AuthorizationRequest
) =>
  vbase.getJSON<AuthorizationResponse | undefined>(
    authorizationsBucket,
    req.paymentId,
    true
  )
