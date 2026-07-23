import { decryptSecret, encryptSecret, maskSecret } from './encryption'
import { getSupabaseAdmin } from './supabaseAdmin'
import type { IntegrationSettings, MaskedIntegrationSettings, PublicPaymentOptions } from './types'

const SECRET_KEYS = new Set([
  'stripe_secret_key',
  'stripe_webhook_secret',
  'paypal_client_secret',
  'resend_api_key',
])

const KEY_MAP: Record<string, keyof IntegrationSettings> = {
  stripe_publishable_key: 'stripePublishableKey',
  stripe_secret_key: 'stripeSecretKey',
  stripe_webhook_secret: 'stripeWebhookSecret',
  stripe_mode: 'stripeMode',
  payment_stripe_enabled: 'stripeEnabled',
  paypal_client_id: 'paypalClientId',
  paypal_client_secret: 'paypalClientSecret',
  paypal_mode: 'paypalMode',
  payment_paypal_enabled: 'paypalEnabled',
  resend_api_key: 'resendApiKey',
  email_from_name: 'emailFromName',
  email_from_address: 'emailFromAddress',
  email_admin_notify: 'emailAdminNotify',
}

const DB_KEY_MAP = Object.fromEntries(
  Object.entries(KEY_MAP).map(([db, ts]) => [ts, db]),
) as Record<keyof IntegrationSettings, string>

function defaults(): IntegrationSettings {
  return {
    stripePublishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    stripeMode: 'test',
    stripeEnabled: true,
    paypalClientId: '',
    paypalClientSecret: '',
    paypalMode: 'sandbox',
    paypalEnabled: false,
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    emailFromName: 'Donate Quran',
    emailFromAddress: '',
    emailAdminNotify: '',
  }
}

function parseBool(value: string) {
  return value === 'true' || value === '1'
}

function rowToSettings(rows: { key: string; value: string; is_secret: boolean }[]): IntegrationSettings {
  const config = defaults()
  for (const row of rows) {
    const field = KEY_MAP[row.key]
    if (!field) continue
    const raw = row.is_secret ? decryptSecret(row.value) : row.value
    switch (field) {
      case 'stripeMode':
        config.stripeMode = raw === 'live' ? 'live' : 'test'
        break
      case 'paypalMode':
        config.paypalMode = raw === 'live' ? 'live' : 'sandbox'
        break
      case 'stripeEnabled':
      case 'paypalEnabled':
        config[field] = parseBool(raw)
        break
      default:
        config[field] = raw
    }
  }
  return config
}

export async function loadIntegrationSettings(): Promise<IntegrationSettings> {
  const admin = getSupabaseAdmin()
  if (!admin) return defaults()

  const { data } = await admin.from('dq_integration_settings').select('key, value, is_secret')
  if (!data?.length) return defaults()
  return rowToSettings(data)
}

export function toMaskedSettings(config: IntegrationSettings): MaskedIntegrationSettings {
  return {
    stripePublishableKey: config.stripePublishableKey,
    stripeSecretKeyMasked: maskSecret(config.stripeSecretKey),
    stripeWebhookSecretMasked: maskSecret(config.stripeWebhookSecret),
    stripeMode: config.stripeMode,
    stripeEnabled: config.stripeEnabled,
    stripeConfigured: Boolean(config.stripeSecretKey),
    paypalClientId: config.paypalClientId,
    paypalClientSecretMasked: maskSecret(config.paypalClientSecret),
    paypalMode: config.paypalMode,
    paypalEnabled: config.paypalEnabled,
    paypalConfigured: Boolean(config.paypalClientId && config.paypalClientSecret),
    resendApiKeyMasked: maskSecret(config.resendApiKey),
    resendConfigured: Boolean(config.resendApiKey && config.emailFromAddress),
    emailFromName: config.emailFromName,
    emailFromAddress: config.emailFromAddress,
    emailAdminNotify: config.emailAdminNotify,
  }
}

export function toPublicPaymentOptions(config: IntegrationSettings): PublicPaymentOptions {
  return {
    stripeEnabled: config.stripeEnabled && Boolean(config.stripeSecretKey),
    paypalEnabled: config.paypalEnabled && Boolean(config.paypalClientId && config.paypalClientSecret),
    stripePublishableKey: config.stripePublishableKey,
  }
}

export async function saveIntegrationSettings(
  input: Partial<IntegrationSettings> & { keepSecrets?: boolean },
  existing?: IntegrationSettings,
): Promise<void> {
  const admin = getSupabaseAdmin()
  if (!admin) throw new Error('Server database configuration is missing.')

  const current = existing ?? (await loadIntegrationSettings())
  const merged = { ...current, ...input }
  const rows: { key: string; value: string; is_secret: boolean; updated_at: string }[] = []

  for (const [field, dbKey] of Object.entries(DB_KEY_MAP) as [keyof IntegrationSettings, string][]) {
    const isSecret = SECRET_KEYS.has(dbKey)
    let value = String(merged[field] ?? '')

    if (field === 'stripeEnabled' || field === 'paypalEnabled') {
      value = merged[field] ? 'true' : 'false'
    }

    if (isSecret) {
      if (!value && input.keepSecrets) {
        const { data } = await admin.from('dq_integration_settings').select('value').eq('key', dbKey).maybeSingle()
        if (data?.value) continue
      }
      if (!value) {
        rows.push({ key: dbKey, value: '', is_secret: true, updated_at: new Date().toISOString() })
        continue
      }
      value = encryptSecret(value)
    }

    rows.push({ key: dbKey, value, is_secret: isSecret, updated_at: new Date().toISOString() })
  }

  const { error } = await admin.from('dq_integration_settings').upsert(rows, { onConflict: 'key' })
  if (error) throw new Error(error.message)
}
