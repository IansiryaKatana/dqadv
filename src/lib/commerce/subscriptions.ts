import Stripe from 'stripe'
import { getSupabaseAdmin } from '#/lib/integrations/supabaseAdmin'
import { loadIntegrationSettings } from '#/lib/integrations/paymentConfig'
import { cancelPayPalSubscription } from './paypal'
import { createCommerceDonation } from './createDonation'
import { markDonationPaid } from './markDonationPaid'

type SubscriptionRow = {
  id: string
  provider: string
  external_id: string
  status: string
  amount: number
  currency: string
  donor_name: string
  donor_email: string
  donor_phone: string | null
  donor_user_id: string | null
  dedication: string | null
  last_payment_id: string | null
}

export async function upsertActiveSubscription(input: {
  provider: 'stripe' | 'paypal'
  externalId: string
  amount: number
  currency: string
  donorName: string
  donorEmail: string
  donorPhone?: string | null
  donorUserId?: string | null
  dedication?: string | null
  lastPaymentId?: string | null
}) {
  const admin = getSupabaseAdmin()
  if (!admin) return null

  const { data: existing } = await admin
    .from('dq_donation_subscriptions')
    .select('id')
    .eq('provider', input.provider)
    .eq('external_id', input.externalId)
    .maybeSingle()

  if (existing?.id) {
    await admin
      .from('dq_donation_subscriptions')
      .update({
        status: 'active',
        amount: input.amount,
        last_payment_id: input.lastPaymentId ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    return existing.id as string
  }

  const { data, error } = await admin
    .from('dq_donation_subscriptions')
    .insert({
      provider: input.provider,
      external_id: input.externalId,
      status: 'active',
      amount: input.amount,
      currency: input.currency,
      donor_name: input.donorName,
      donor_email: input.donorEmail,
      donor_phone: input.donorPhone ?? null,
      donor_user_id: input.donorUserId ?? null,
      dedication: input.dedication ?? null,
      last_payment_id: input.lastPaymentId ?? null,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id as string
}

export async function linkDonationToSubscription(donationId: string, subscriptionId: string) {
  const admin = getSupabaseAdmin()
  if (!admin) return
  await admin.from('dq_donations').update({ subscription_id: subscriptionId }).eq('id', donationId)
}

export async function setSubscriptionStatus(
  provider: 'stripe' | 'paypal',
  externalId: string,
  status: 'active' | 'paused' | 'cancelled' | 'past_due',
) {
  const admin = getSupabaseAdmin()
  if (!admin) return
  await admin
    .from('dq_donation_subscriptions')
    .update({
      status,
      cancelled_at: status === 'cancelled' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('provider', provider)
    .eq('external_id', externalId)
}

export async function recordRecurringPayment(input: {
  provider: 'stripe' | 'paypal'
  externalId: string
  paymentId: string
  amount?: number
}) {
  const admin = getSupabaseAdmin()
  if (!admin) return null

  const { data: sub } = await admin
    .from('dq_donation_subscriptions')
    .select(
      'id, provider, external_id, status, amount, currency, donor_name, donor_email, donor_phone, donor_user_id, dedication, last_payment_id',
    )
    .eq('provider', input.provider)
    .eq('external_id', input.externalId)
    .maybeSingle()

  if (!sub) return null
  if (sub.last_payment_id && sub.last_payment_id === input.paymentId) return null

  const { data: existingPayment } = await admin
    .from('dq_donations')
    .select('id')
    .eq('payment_intent_id', input.paymentId)
    .maybeSingle()
  if (existingPayment) {
    await admin
      .from('dq_donation_subscriptions')
      .update({ last_payment_id: input.paymentId, updated_at: new Date().toISOString() })
      .eq('id', sub.id)
    return existingPayment.id
  }

  const amount = input.amount ?? Number(sub.amount)
  const donation = await createCommerceDonation({
    orderKind: 'donation',
    frequency: 'monthly',
    itemsSubtotal: amount,
    postageTotal: 0,
    total: amount,
    currency: sub.currency,
    snapshot: { type: 'donation', amount, frequency: 'monthly' },
    donorName: sub.donor_name,
    donorEmail: sub.donor_email,
    donorPhone: sub.donor_phone ?? undefined,
    dedication: sub.dedication ?? undefined,
    donorUserId: sub.donor_user_id,
    paymentProvider: input.provider,
    fulfillmentStatus: 'not_required',
    subscriptionId: sub.id,
  })

  await markDonationPaid({
    reference: donation.reference,
    paymentProvider: input.provider,
    externalId: input.paymentId,
  })

  await admin
    .from('dq_donation_subscriptions')
    .update({
      last_payment_id: input.paymentId,
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', sub.id)

  return donation.id
}

export async function cancelSubscriptionById(input: {
  subscriptionDbId: string
  actor: 'donor' | 'admin'
}) {
  const admin = getSupabaseAdmin()
  if (!admin) throw new Error('Server database configuration is missing.')

  const { data: sub, error } = await admin
    .from('dq_donation_subscriptions')
    .select('id, provider, external_id, status, donor_email, donor_name')
    .eq('id', input.subscriptionDbId)
    .maybeSingle()

  if (error || !sub) throw new Error('Subscription not found.')
  if (sub.status === 'cancelled') return { ok: true as const }

  if (sub.provider === 'stripe') {
    const config = await loadIntegrationSettings()
    if (!config.stripeSecretKey) throw new Error('Stripe is not configured.')
    const stripe = new Stripe(config.stripeSecretKey)
    await stripe.subscriptions.cancel(sub.external_id)
  } else {
    await cancelPayPalSubscription(sub.external_id)
  }

  await admin
    .from('dq_donation_subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sub.id)

  try {
    const { sendSubscriptionCancelledEmail } = await import('#/lib/email/sendDonationEmails')
    await sendSubscriptionCancelledEmail(sub as SubscriptionRow)
  } catch {
    // email should not block cancel
  }

  return { ok: true as const }
}

export type { SubscriptionRow }
