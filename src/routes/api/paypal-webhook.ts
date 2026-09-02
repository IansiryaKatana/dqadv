import { createFileRoute } from '@tanstack/react-router'
import { markDonationPaid } from '#/lib/commerce/markDonationPaid'
import { verifyPayPalWebhook } from '#/lib/commerce/paypal'
import { getSupabaseAdmin } from '#/lib/integrations/supabaseAdmin'
import {
  linkDonationToSubscription,
  recordRecurringPayment,
  setSubscriptionStatus,
  upsertActiveSubscription,
} from '#/lib/commerce/subscriptions'

export const Route = createFileRoute('/api/paypal-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text()

        const verified = await verifyPayPalWebhook(request.headers, body).catch(() => false)
        if (!verified && process.env.PAYPAL_WEBHOOK_ID) {
          return new Response('Invalid signature', { status: 400 })
        }

        const event = JSON.parse(body) as {
          event_type?: string
          resource?: {
            custom_id?: string
            id?: string
            status?: string
            billing_agreement_id?: string
            supplementary_data?: { related_ids?: { order_id?: string } }
            amount?: { total?: string; value?: string }
          }
        }

        if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
          const reference = event.resource?.custom_id
          const captureId = event.resource?.id
          const orderId = event.resource?.supplementary_data?.related_ids?.order_id
          if (reference) {
            await markDonationPaid({
              reference,
              paymentProvider: 'paypal',
              externalId: captureId ?? orderId ?? null,
              paypalOrderId: orderId ?? null,
            })
          }
        }

        if (
          event.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED' ||
          event.event_type === 'BILLING.SUBSCRIPTION.UPDATED'
        ) {
          const subscriptionId = event.resource?.id
          const reference = event.resource?.custom_id
          if (subscriptionId && reference) {
            const paid = await markDonationPaid({
              reference,
              paymentProvider: 'paypal',
              externalId: subscriptionId,
              paypalOrderId: subscriptionId,
            })
            const admin = getSupabaseAdmin()
            const { data: donation } = admin
              ? await admin
                  .from('dq_donations')
                  .select(
                    'id, total, currency, donor_name, donor_email, donor_phone, donor_user_id, dedication',
                  )
                  .eq('reference', reference)
                  .maybeSingle()
              : { data: null }
            if (donation) {
              const subDbId = await upsertActiveSubscription({
                provider: 'paypal',
                externalId: subscriptionId,
                amount: Number(donation.total),
                currency: donation.currency,
                donorName: donation.donor_name,
                donorEmail: donation.donor_email,
                donorPhone: donation.donor_phone,
                donorUserId: donation.donor_user_id,
                dedication: donation.dedication,
                lastPaymentId: subscriptionId,
              })
              if (subDbId) await linkDonationToSubscription(donation.id, subDbId)
            }
            void paid
          }
        }

        if (event.event_type === 'PAYMENT.SALE.COMPLETED') {
          const agreementId = event.resource?.billing_agreement_id
          const saleId = event.resource?.id
          const amountRaw = event.resource?.amount?.total ?? event.resource?.amount?.value
          if (agreementId && saleId) {
            await recordRecurringPayment({
              provider: 'paypal',
              externalId: agreementId,
              paymentId: saleId,
              amount: amountRaw ? Number(amountRaw) : undefined,
            })
          }
        }

        if (
          event.event_type === 'BILLING.SUBSCRIPTION.CANCELLED' ||
          event.event_type === 'BILLING.SUBSCRIPTION.EXPIRED' ||
          event.event_type === 'BILLING.SUBSCRIPTION.SUSPENDED'
        ) {
          const subscriptionId = event.resource?.id
          if (subscriptionId) {
            const status =
              event.event_type === 'BILLING.SUBSCRIPTION.SUSPENDED' ? 'paused' : 'cancelled'
            await setSubscriptionStatus('paypal', subscriptionId, status)
          }
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
