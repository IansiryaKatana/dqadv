import { createServerFn } from '@tanstack/react-start'
import Stripe from 'stripe'
import { verifyAdminAccess } from '#/lib/admin/verifyAdminAccess'
import {
  loadIntegrationSettings,
  saveIntegrationSettings,
  toMaskedSettings,
  toPublicPaymentOptions,
} from './paymentConfig'
import type { IntegrationSettings } from './types'
import { sendTestEmail } from '#/lib/email/sendDonationEmails'
import { getPayPalAccessToken } from '#/lib/commerce/paypal'

export const getPublicPaymentOptions = createServerFn({ method: 'POST' }).handler(async () => {
  const config = await loadIntegrationSettings()
  return toPublicPaymentOptions(config)
})

export const getMaskedIntegrationSettings = createServerFn({ method: 'POST' })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }) => {
    await verifyAdminAccess(data.accessToken)
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
    await getPayPalAccessToken()
    return { ok: true as const }
  })

export const testResendConnection = createServerFn({ method: 'POST' })
  .validator((data: { accessToken: string; to: string }) => data)
  .handler(async ({ data }) => {
    await verifyAdminAccess(data.accessToken)
    await sendTestEmail(data.to)
    return { ok: true as const }
  })
