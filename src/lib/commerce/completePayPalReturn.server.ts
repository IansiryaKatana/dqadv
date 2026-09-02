import { capturePayPalOrder } from './paypal'
import { markDonationPaid } from './markDonationPaid'
import { getSupabaseAdmin } from '#/lib/integrations/supabaseAdmin'
import { linkDonationToSubscription, upsertActiveSubscription } from './subscriptions'

export async function runCompletePayPalReturn(data: {
  reference: string
  token?: string
  subscription_id?: string
}) {
  if (data.subscription_id) {
    await markDonationPaid({
      reference: data.reference,
      paymentProvider: 'paypal',
      externalId: data.subscription_id,
      paypalOrderId: data.subscription_id,
    })
    const admin = getSupabaseAdmin()
    const { data: donation } = admin
      ? await admin
          .from('dq_donations')
          .select('id, total, currency, donor_name, donor_email, donor_phone, donor_user_id, dedication')
          .eq('reference', data.reference)
          .maybeSingle()
      : { data: null }
    if (donation) {
      const subDbId = await upsertActiveSubscription({
        provider: 'paypal',
        externalId: data.subscription_id,
        amount: Number(donation.total),
        currency: donation.currency,
        donorName: donation.donor_name,
        donorEmail: donation.donor_email,
        donorPhone: donation.donor_phone,
        donorUserId: donation.donor_user_id,
        dedication: donation.dedication,
        lastPaymentId: data.subscription_id,
      })
      if (subDbId) await linkDonationToSubscription(donation.id, subDbId)
    }
    return { ok: true as const }
  }

  if (data.token) {
    const result = await capturePayPalOrder(data.token)
    if (result.status === 'COMPLETED') {
      await markDonationPaid({
        reference: data.reference,
        paymentProvider: 'paypal',
        externalId: result.captureId ?? data.token,
        paypalOrderId: data.token,
      })
    }
    return { ok: result.status === 'COMPLETED' }
  }

  return { ok: false as const }
}
