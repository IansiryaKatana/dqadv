import { getSupabaseAdmin } from '#/lib/integrations/supabaseAdmin'
import { donationReference } from './donationReference'
import type { CommerceSnapshot, DonorDetails, ShippingAddress } from './checkoutShared'

export type CreateCommerceDonationInput = DonorDetails & {
  orderKind: 'donation' | 'quran_order'
  frequency: 'one_time' | 'monthly'
  itemsSubtotal: number
  postageTotal: number
  total: number
  currency?: string
  snapshot: CommerceSnapshot
  shippingAddress?: ShippingAddress | null
  paymentProvider: 'stripe' | 'paypal'
  fulfillmentStatus: 'pending' | 'not_required'
  subscriptionId?: string | null
}

export type DonationRecord = {
  id: string
  reference: string
  total: number
  currency: string
}

export async function createCommerceDonation(input: CreateCommerceDonationInput): Promise<DonationRecord> {
  const admin = getSupabaseAdmin()
  if (!admin) throw new Error('Server database configuration is missing.')

  const currency = (input.currency ?? 'GBP').toUpperCase()
  const reference = donationReference()

  const { data, error } = await admin
    .from('dq_donations')
    .insert({
      reference,
      cart_snapshot: input.snapshot,
      donor_name: input.donorName.trim(),
      donor_email: input.donorEmail.trim().toLowerCase(),
      donor_phone: input.donorPhone?.trim() || null,
      shipping_address: input.shippingAddress ?? null,
      dedication: input.dedication?.trim() || null,
      subtotal: input.itemsSubtotal,
      items_subtotal: input.itemsSubtotal,
      postage_total: input.postageTotal,
      total: input.total,
      currency,
      payment_provider: input.paymentProvider,
      payment_status: 'pending',
      fulfillment_status: input.fulfillmentStatus,
      order_kind: input.orderKind,
      frequency: input.frequency,
      donor_user_id: input.donorUserId ?? null,
      subscription_id: input.subscriptionId ?? null,
    })
    .select('id, reference, total, currency')
    .single()

  if (error) throw new Error(error.message)
  return {
    id: data.id,
    reference: data.reference,
    total: Number(data.total),
    currency: data.currency,
  }
}
