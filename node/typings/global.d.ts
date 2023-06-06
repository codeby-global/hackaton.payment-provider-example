import { ServiceContext } from '@vtex/api'
import { Clients } from '../clients'

declare global {
  type Context = ServiceContext<Clients, State>

  type State = RecorderState

  interface AppSettings {
    getnetTransationalClientId: string
    getnetTransationalSecretId: string
  }
}
