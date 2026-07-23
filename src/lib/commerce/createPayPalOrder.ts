import { createServerFn } from '@tanstack/react-start'
import { loadIntegrationSettings } from '#/lib/integrations/paymentConfig'
import { getSupabaseAdmin } from '#/lib/integrations/supabaseAdmin'
import type { GiftCartItem } from './types'
import { createDonationRecord, validateCheckoutInput } from './createDonation'
import { createPayPalOrder as createOrder } from './paypal'

export type PayPalCheckoutInput = {
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
  returnUrl: string
  cancelUrl: string
  donorUserId?: string | null
}

export const createPayPalCheckout = createServerFn({ method: 'POST' })
  .validator((data: PayPalCheckoutInput) => data)
  .handler(async ({ data }) => {
    const config = await loadIntegrationSettings()

    if (!config.paypalEnabled || !config.paypalClientId || !config.paypalClientSecret) {
      throw new Error(
        'PayPal checkout is temporarily unavailable. Please try another payment method or use bank transfer below.',
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
      paymentProvider: 'paypal',
      donorUserId: data.donorUserId,
    })

    const order = await createOrder({
      reference: donation.reference,
      amount: donation.subtotal,
      currency: donation.currency,
      returnUrl: `${data.returnUrl}?reference=${encodeURIComponent(donation.reference)}`,
      cancelUrl: `${data.cancelUrl}?reference=${encodeURIComponent(donation.reference)}`,
    })

    const admin = getSupabaseAdmin()
    if (admin) {
      await admin
        .from('dq_donations')
        .update({ paypal_order_id: order.orderId, payment_intent_id: order.orderId })
        .eq('id', donation.id)
    }

    return { url: order.approvalUrl, reference: donation.reference, orderId: order.orderId }
  })

export const capturePayPalCheckout = createServerFn({ method: 'POST' })
  .validator((data: { orderId: string; reference: string }) => data)
  .handler(async ({ data }) => {
    const { capturePayPalOrder } = await import('./paypal')
    const { markDonationPaid } = await import('./markDonationPaid')

    const result = await capturePayPalOrder(data.orderId)
    if (result.status === 'COMPLETED') {
      await markDonationPaid({
        reference: data.reference,
        paymentProvider: 'paypal',
        externalId: result.captureId ?? data.orderId,
        paypalOrderId: data.orderId,
      })
    }

    return { status: result.status }
  })
