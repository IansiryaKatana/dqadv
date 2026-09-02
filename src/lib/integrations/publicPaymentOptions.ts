import { createServerFn } from '@tanstack/react-start'

function parseBool(value: string | undefined) {
  return value === 'true' || value === '1'
}

export const getPublicPaymentOptions = createServerFn({ method: 'POST' }).handler(async () => {
  const { getSupabaseAdmin } = await import('./supabaseAdmin')
  const admin = getSupabaseAdmin()
  if (!admin) {
    return { stripeEnabled: false, paypalEnabled: false, stripePublishableKey: '' }
  }

  const { data } = await admin.from('dq_integration_settings').select('key, value')
  const map = Object.fromEntries((data ?? []).map((row) => [row.key, row.value ?? '']))

  return {
    stripeEnabled: parseBool(map.payment_stripe_enabled) && Boolean(map.stripe_secret_key),
    paypalEnabled:
      parseBool(map.payment_paypal_enabled) &&
      Boolean(map.paypal_client_id) &&
      Boolean(map.paypal_client_secret),
    stripePublishableKey: map.stripe_publishable_key ?? '',
  }
})
