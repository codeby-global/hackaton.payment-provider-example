import axios from 'axios'

export async function getnetMailApproveService({
  callbackUrl,
}: {
  callbackUrl: string
}) {
  await axios.post(callbackUrl, {
    status: 'approved',
  })
}
