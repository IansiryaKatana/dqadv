import type { GiftCartItem } from './types'
import { getSupabaseAdmin } from '#/lib/integrations/supabaseAdmin'
import { donationReference } from './donationReference'

export type CreateDonationInput = {
  items: GiftCartItem[]
  donorName: string
  donorEmail: string
  donorPhone?: string
  dedication?: string
  shippingAddress?: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  } | null
  paymentProvider: 'stripe' | 'paypal'
  donorUserId?: string | null
}

export type DonationRecord = {
  id: string
  reference: string
  subtotal: number
  currency: string
}

export async function createDonationRecord(input: CreateDonationInput): Promise<DonationRecord> {
  const admin = getSupabaseAdmin()
  if (!admin) throw new Error('Server database configuration is missing.')

  const subtotal = input.items.reduce((sum, item) => sum + (item.unitAmount ?? 0) * item.quantity, 0)
  const currency = (input.items[0]?.currency ?? 'GBP').toUpperCase()
  const reference = donationReference()

  const { data, error } = await admin
    .from('dq_donations')
    .insert({
      reference,
      cart_snapshot: input.items,
      donor_name: input.donorName.trim(),
      donor_email: input.donorEmail.trim().toLowerCase(),
      donor_phone: input.donorPhone?.trim() || null,
      shipping_address: input.shippingAddress ?? null,
      dedication: input.dedication?.trim() || null,
      subtotal,
      total: subtotal,
      currency,
      payment_provider: input.paymentProvider,
      payment_status: 'pending',
      donor_user_id: input.donorUserId ?? null,
    })
    .select('id, reference, subtotal, currency')
    .single()

  if (error) throw new Error(error.message)
  return {
    id: data.id,
    reference: data.reference,
    subtotal: Number(data.subtotal),
    currency: data.currency,
  }
}

export function validateCheckoutInput(input: {
  items: GiftCartItem[]
  donorName: string
  donorEmail: string
  shippingAddress?: CreateDonationInput['shippingAddress']
  needsShipping: boolean
}) {
  if (!input.items.length) throw new Error('Your gift is empty.')
  if (!input.donorName.trim() || !input.donorEmail.trim()) {
    throw new Error('Name and email are required.')
  }
  if (input.needsShipping && input.shippingAddress) {
    const { line1, city, state, postalCode, country } = input.shippingAddress
    if (!line1.trim() || !city.trim() || !state.trim() || !postalCode.trim() || !country.trim()) {
      throw new Error('Please complete all required delivery fields.')
    }
  }
  for (const item of input.items) {
    if ((item.unitAmount ?? 0) <= 0) {
      throw new Error(`"${item.title}" requires a configured gift amount before checkout.`)
    }
  }
}
