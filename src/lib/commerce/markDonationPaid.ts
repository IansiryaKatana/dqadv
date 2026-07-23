import { getSupabaseAdmin } from '#/lib/integrations/supabaseAdmin'
import { sendDonationEmails } from '#/lib/email/sendDonationEmails'

export type MarkDonationPaidInput = {
  reference: string
  paymentProvider: 'stripe' | 'paypal'
  externalId?: string | null
  stripeSessionId?: string | null
  paypalOrderId?: string | null
}

export async function markDonationPaid(input: MarkDonationPaidInput) {
  const admin = getSupabaseAdmin()
  if (!admin) return null

  const { data: existing } = await admin
    .from('dq_donations')
    .select('id, payment_status, email_receipt_sent_at')
    .eq('reference', input.reference)
    .maybeSingle()

  if (!existing) return null
  if (existing.payment_status === 'paid') {
    return existing
  }

  const { data, error } = await admin
    .from('dq_donations')
    .update({
      payment_status: 'paid',
      payment_provider: input.paymentProvider,
      payment_intent_id: input.externalId ?? null,
      stripe_session_id: input.stripeSessionId ?? null,
      paypal_order_id: input.paypalOrderId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('reference', input.reference)
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  if (!existing.email_receipt_sent_at) {
    try {
      await sendDonationEmails(data)
    } catch {
      // Email failure should not fail webhook
    }
  }

  return data
}

export async function markDonationFailed(reference: string) {
  const admin = getSupabaseAdmin()
  if (!admin) return
  await admin
    .from('dq_donations')
    .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
    .eq('reference', reference)
    .eq('payment_status', 'pending')
}
