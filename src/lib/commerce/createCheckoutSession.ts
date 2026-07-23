import { createServerFn } from '@tanstack/react-start'
import Stripe from 'stripe'
import { loadIntegrationSettings } from '#/lib/integrations/paymentConfig'
import { getSupabaseAdmin } from '#/lib/integrations/supabaseAdmin'
import type { GiftCartItem } from './types'
import { createDonationRecord, validateCheckoutInput } from './createDonation'

export type CheckoutInput = {
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
  successUrl: string
  cancelUrl: string
  donorUserId?: string | null
}

export const createCheckoutSession = createServerFn({ method: 'POST' })
  .validator((data: CheckoutInput) => data)
  .handler(async ({ data }) => {
    const config = await loadIntegrationSettings()

    if (!config.stripeEnabled || !config.stripeSecretKey) {
      throw new Error(
        'Online payment is temporarily unavailable. Please try again later or use bank transfer below.',
      )
    }

    const needsShipping = data.items.some((i) => i.requiresShipping)
    validateCheckoutInput({
      items: data.items,
      donorName: data.donorName,
      donorEmail: data.donorEmail,
      shippingAddress: data.shippingAddress,
      needsShipping,
    })

    const donation = await createDonationRecord({
      items: data.items,
      donorName: data.donorName,
      donorEmail: data.donorEmail,
      donorPhone: data.donorPhone,
      dedication: data.dedication,
      shippingAddress: data.shippingAddress,
      paymentProvider: 'stripe',
      donorUserId: data.donorUserId,
    })

    const stripe = new Stripe(config.stripeSecretKey)
    const currency = donation.currency.toLowerCase()

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = data.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency,
        unit_amount: Math.round((item.unitAmount ?? 0) * 100),
        product_data: {
          name: item.title,
          description: item.impactStatement ?? 'Donate Quran sponsorship',
          images: item.imageUrl ? [item.imageUrl] : undefined,
        },
      },
    }))

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: data.donorEmail.trim(),
      line_items: lineItems,
      success_url: `${data.successUrl}?reference=${encodeURIComponent(donation.reference)}`,
      cancel_url: `${data.cancelUrl}?reference=${encodeURIComponent(donation.reference)}`,
      metadata: {
        reference: donation.reference,
        donation_id: donation.id,
      },
    })

    const admin = getSupabaseAdmin()
    if (admin && session.id) {
      await admin
        .from('dq_donations')
        .update({ stripe_session_id: session.id, payment_intent_id: session.id })
        .eq('id', donation.id)
    }

    if (!session.url) {
      throw new Error('We could not connect to our payment provider. Please try again in a few minutes.')
    }

    return { url: session.url, reference: donation.reference }
  })
