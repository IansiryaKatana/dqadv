import Stripe from 'stripe'
import { loadIntegrationSettings } from '#/lib/integrations/paymentConfig'
import { getSupabaseAdmin } from '#/lib/integrations/supabaseAdmin'
import { parseDonationAmount, parseFrequency, DONATE_CURRENCY } from './donateAmounts'
import { createCommerceDonation } from './createDonation'
import { validateDonor } from './checkoutShared'
import { createPayPalOrder, createPayPalSubscription } from './paypal'
import type { GiveCheckoutInput } from './createGiveCheckout'

export async function runGiveCheckout(data: GiveCheckoutInput) {
  const amount = parseDonationAmount(data.amount)
  const frequency = parseFrequency(data.frequency)
  validateDonor(data)

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
    orderKind: 'donation',
    frequency,
    itemsSubtotal: amount,
    postageTotal: 0,
    total: amount,
    currency: DONATE_CURRENCY,
    snapshot: { type: 'donation', amount, frequency },
    donorName: data.donorName,
    donorEmail: data.donorEmail,
    donorPhone: data.donorPhone,
    dedication: data.dedication,
    donorUserId: data.donorUserId,
    paymentProvider: method,
    fulfillmentStatus: 'not_required',
  })

  const successUrl = `${data.successUrl}?reference=${encodeURIComponent(donation.reference)}`
  const cancelUrl = `${data.cancelUrl}?reference=${encodeURIComponent(donation.reference)}`

  if (method === 'stripe') {
    const stripe = new Stripe(config.stripeSecretKey)
    const isMonthly = frequency === 'monthly'
    const session = await stripe.checkout.sessions.create({
      mode: isMonthly ? 'subscription' : 'payment',
      customer_email: data.donorEmail.trim(),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: DONATE_CURRENCY.toLowerCase(),
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: isMonthly ? 'Monthly donation' : 'Donation',
              description: 'Gift to Donate Quran',
            },
            ...(isMonthly ? { recurring: { interval: 'month' as const } } : {}),
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        reference: donation.reference,
        donation_id: donation.id,
        order_kind: 'donation',
        frequency,
      },
      subscription_data: isMonthly
        ? {
            metadata: {
              reference: donation.reference,
              donation_id: donation.id,
              order_kind: 'donation',
            },
          }
        : undefined,
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

  const paypalReturnUrl = data.successUrl.replace(/\/checkout\/success\/?/, '/checkout/paypal-return')
  const paypalReturn = `${paypalReturnUrl}${paypalReturnUrl.includes('?') ? '&' : '?'}reference=${encodeURIComponent(donation.reference)}`

  if (frequency === 'monthly') {
    const sub = await createPayPalSubscription({
      reference: donation.reference,
      amount,
      currency: DONATE_CURRENCY,
      donorEmail: data.donorEmail,
      returnUrl: paypalReturn,
      cancelUrl,
    })
    const admin = getSupabaseAdmin()
    if (admin) {
      await admin
        .from('dq_donations')
        .update({ paypal_order_id: sub.subscriptionId, payment_intent_id: sub.subscriptionId })
        .eq('id', donation.id)
    }
    return { url: sub.approvalUrl, reference: donation.reference, orderId: sub.subscriptionId }
  }

  const order = await createPayPalOrder({
    reference: donation.reference,
    amount,
    currency: DONATE_CURRENCY,
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
