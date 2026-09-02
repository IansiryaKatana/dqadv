import Stripe from 'stripe'
import { loadIntegrationSettings } from '#/lib/integrations/paymentConfig'
import { getSupabaseAdmin } from '#/lib/integrations/supabaseAdmin'
import { createCommerceDonation } from './createDonation'
import { validateDonor, validateUkAddress } from './checkoutShared'
import { createPayPalOrder } from './paypal'
import {
  DEFAULT_POSTAGE_TIERS,
  isUkCountry,
  mapPostageTierRow,
  quoteUkQuranOrder,
} from './quoteUkQuranOrder'
import type { QuranOrderCheckoutInput } from './createQuranOrderCheckout'

async function loadTiersForQuote() {
  const admin = getSupabaseAdmin()
  if (!admin) return DEFAULT_POSTAGE_TIERS
  const { data, error } = await admin
    .from('dq_quran_postage_tiers')
    .select('band, quantity, copies, cost, postage, total, sort_order, is_active')
    .eq('is_active', true)
  if (error || !data?.length) return DEFAULT_POSTAGE_TIERS
  return data.map((row) =>
    mapPostageTierRow({
      band: row.band,
      quantity: Number(row.quantity),
      copies: Number(row.copies),
      cost: Number(row.cost),
      postage: Number(row.postage),
      total: Number(row.total),
      sort_order: Number(row.sort_order ?? 0),
    }),
  )
}

export async function runQuranOrderCheckout(data: QuranOrderCheckoutInput) {
  validateDonor(data)
  validateUkAddress(data.shippingAddress)
  if (!isUkCountry(data.shippingAddress.country)) {
    throw new Error('We currently deliver printed Qur’ans within the United Kingdom only.')
  }

  const tiers = await loadTiersForQuote()
  const quote = quoteUkQuranOrder(data.band, data.quantity, tiers)
  if (quote.total <= 0) throw new Error('That order total is invalid. Please try another quantity.')

  const config = await loadIntegrationSettings()
  const method = data.paymentMethod

  if (method === 'stripe' && (!config.stripeEnabled || !config.stripeSecretKey)) {
    throw new Error(
      'Online payment is temporarily unavailable. Please try again later or use bank transfer below.',
    )
  }
  if (method === 'paypal' && (!config.paypalEnabled || !config.paypalClientId || !config.paypalClientSecret)) {
    throw new Error(
      'PayPal checkout is temporarily unavailable. Please try another payment method or use bank transfer below.',
    )
  }

  const donation = await createCommerceDonation({
    orderKind: 'quran_order',
    frequency: 'one_time',
    itemsSubtotal: quote.cost,
    postageTotal: quote.postage,
    total: quote.total,
    currency: 'GBP',
    snapshot: {
      type: 'quran_order',
      mode: quote.band,
      quantity: quote.quantity,
      copies: quote.copies,
      boxes: quote.boxes,
      cost: quote.cost,
      postage: quote.postage,
      total: quote.total,
      label: quote.label,
    },
    shippingAddress: {
      ...data.shippingAddress,
      country: 'United Kingdom',
    },
    donorName: data.donorName,
    donorEmail: data.donorEmail,
    donorPhone: data.donorPhone,
    dedication: data.dedication,
    donorUserId: data.donorUserId,
    paymentProvider: method,
    fulfillmentStatus: 'pending',
  })

  const successUrl = `${data.successUrl}?reference=${encodeURIComponent(donation.reference)}`
  const cancelUrl = `${data.cancelUrl}?reference=${encodeURIComponent(donation.reference)}`
  const paypalReturnUrl = data.successUrl.replace(/\/checkout\/success\/?/, '/checkout/paypal-return')
  const paypalReturn = `${paypalReturnUrl}${paypalReturnUrl.includes('?') ? '&' : '?'}reference=${encodeURIComponent(donation.reference)}`

  if (method === 'stripe') {
    const stripe = new Stripe(config.stripeSecretKey)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    if (quote.cost > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: 'gbp',
          unit_amount: Math.round(quote.cost * 100),
          product_data: {
            name: quote.label,
            description: 'Contribution to print cost',
          },
        },
      })
    }
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: 'gbp',
        unit_amount: Math.round(quote.postage * 100),
        product_data: {
          name: 'Postage & packaging',
          description: quote.cost > 0 ? 'UK delivery' : 'The Qur’an is free; you pay postage only',
        },
      },
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: data.donorEmail.trim(),
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        reference: donation.reference,
        donation_id: donation.id,
        order_kind: 'quran_order',
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
  }

  const order = await createPayPalOrder({
    reference: donation.reference,
    amount: quote.total,
    currency: 'GBP',
    returnUrl: paypalReturn,
    cancelUrl,
  })
  const admin = getSupabaseAdmin()
  if (admin) {
    await admin
      .from('dq_donations')
      .update({ paypal_order_id: order.orderId, payment_intent_id: order.orderId })
      .eq('id', donation.id)
  }
  return { url: order.approvalUrl, reference: donation.reference, orderId: order.orderId }
}
