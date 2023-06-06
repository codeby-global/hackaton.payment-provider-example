import { getnetMailApproveService } from '../services/getnetMailApproveService'

export async function getnetMailApprove(ctx: Context): Promise<void> {
  ctx.set('Cache-Control', 'no-cache')

  const { query } = ctx

  await getnetMailApproveService(query as { callbackUrl: string })

  ctx.body = 'Pagamento aprovado!'
}
