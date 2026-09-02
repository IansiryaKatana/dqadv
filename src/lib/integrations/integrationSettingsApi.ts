import { createServerFn } from '@tanstack/react-start'
import { verifyAdminAccess } from '#/lib/admin/verifyAdminAccess'
import type { IntegrationSettings } from './types'
import { getPublicPaymentOptions } from './publicPaymentOptions'

export { getPublicPaymentOptions }

export const getMaskedIntegrationSettings = createServerFn({ method: 'POST' })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }) => {
    await verifyAdminAccess(data.accessToken)
    const { loadIntegrationSettings, toMaskedSettings } = await import('./paymentConfig')
    const config = await loadIntegrationSettings()
    return toMaskedSettings(config)
  })

type SaveInput = {
  accessToken: string
  settings: Partial<IntegrationSettings>
  keepSecrets?: boolean
}

export const saveIntegrationSettingsFn = createServerFn({ method: 'POST' })
  .validator((data: SaveInput) => data)
  .handler(async ({ data }) => {
    await verifyAdminAccess(data.accessToken)
    const { loadIntegrationSettings, saveIntegrationSettings, toMaskedSettings } = await import('./paymentConfig')
    const existing = await loadIntegrationSettings()
    const merged = { ...existing, ...data.settings }
    if (data.keepSecrets) {
      if (!data.settings.stripeSecretKey) merged.stripeSecretKey = existing.stripeSecretKey
      if (!data.settings.stripeWebhookSecret) merged.stripeWebhookSecret = existing.stripeWebhookSecret
      if (!data.settings.paypalClientSecret) merged.paypalClientSecret = existing.paypalClientSecret
      if (!data.settings.resendApiKey) merged.resendApiKey = existing.resendApiKey
    }
    await saveIntegrationSettings(merged, existing)
    return toMaskedSettings(await loadIntegrationSettings())
  })

export const testStripeConnection = createServerFn({ method: 'POST' })
  .validator((data: { accessToken: string; secretKey?: string }) => data)
  .handler(async ({ data }) => {
    await verifyAdminAccess(data.accessToken)
    const { loadIntegrationSettings } = await import('./paymentConfig')
    const { default: Stripe } = await import('stripe')
    const config = await loadIntegrationSettings()
    const key = data.secretKey?.trim() || config.stripeSecretKey
    if (!key) throw new Error('Stripe secret key is required.')
    const stripe = new Stripe(key)
    await stripe.balance.retrieve()
    return { ok: true as const }
  })

export const testPayPalConnection = createServerFn({ method: 'POST' })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }) => {
    await verifyAdminAccess(data.accessToken)
    const { getPayPalAccessToken } = await import('#/lib/commerce/paypal')
    await getPayPalAccessToken()
    return { ok: true as const }
  })

export const testResendConnection = createServerFn({ method: 'POST' })
  .validator((data: { accessToken: string; to: string }) => data)
  .handler(async ({ data }) => {
    await verifyAdminAccess(data.accessToken)
    const { sendTestEmail } = await import('#/lib/email/sendDonationEmails')
    await sendTestEmail(data.to)
    return { ok: true as const }
  })
