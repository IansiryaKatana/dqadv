import { Resend } from 'resend'
import { loadIntegrationSettings } from '#/lib/integrations/paymentConfig'

export async function getResendClient() {
  const config = await loadIntegrationSettings()
  if (!config.resendApiKey) return null
  return { client: new Resend(config.resendApiKey), config }
}
