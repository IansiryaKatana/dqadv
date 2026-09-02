import { createFileRoute } from '@tanstack/react-router'
import Stripe from 'stripe'
import { loadIntegrationSettings } from '#/lib/integrations/paymentConfig'
import { getSupabaseAdmin } from '#/lib/integrations/supabaseAdmin'
import { markDonationFailed, markDonationPaid } from '#/lib/commerce/markDonationPaid'
import {
  linkDonationToSubscription,
  recordRecurringPayment,
  setSubscriptionStatus,
  upsertActiveSubscription,
} from '#/lib/commerce/subscriptions'

export const Route = createFileRoute('/api/stripe-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const config = await loadIntegrationSettings()
        const stripeKey = config.stripeSecretKey
        const webhookSecret = config.stripeWebhookSecret

        if (!stripeKey || !webhookSecret) {
          return new Response('Webhook not configured', { status: 500 })
        }

        const stripe = new Stripe(stripeKey)
        const body = await request.text()
        const signature = request.headers.get('stripe-signature')

        if (!signature) {
          return new Response('Missing signature', { status: 400 })
        }

        let event: Stripe.Event
        try {
          event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
        } catch {
          return new Response('Invalid signature', { status: 400 })
        }

        if (event.type === 'checkout.session.completed') {
          const session = event.data.object as Stripe.Checkout.Session
          const reference = session.metadata?.reference
          if (reference) {
            const paid = await markDonationPaid({
              reference,
              paymentProvider: 'stripe',
              externalId:
                typeof session.payment_intent === 'string'
                  ? session.payment_intent
                  : session.payment_intent?.id ?? session.id,
              stripeSessionId: session.id,
            })

            const subscriptionId =
              typeof session.subscription === 'string'
                ? session.subscription
                : session.subscription?.id
            if (subscriptionId && paid) {
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
                  provider: 'stripe',
                  externalId: subscriptionId,
                  amount: Number(donation.total),
                  currency: donation.currency,
                  donorName: donation.donor_name,
                  donorEmail: donation.donor_email,
                  donorPhone: donation.donor_phone,
                  donorUserId: donation.donor_user_id,
                  dedication: donation.dedication,
                  lastPaymentId:
                    typeof session.payment_intent === 'string'
                      ? session.payment_intent
                      : session.invoice?.toString() ?? session.id,
                })
                if (subDbId) await linkDonationToSubscription(donation.id, subDbId)
              }
            }
          }
        }

        if (event.type === 'checkout.session.expired') {
          const session = event.data.object as Stripe.Checkout.Session
          const reference = session.metadata?.reference
          if (reference) await markDonationFailed(reference)
        }

        if (event.type === 'payment_intent.payment_failed') {
          const intent = event.data.object as Stripe.PaymentIntent
          const reference = intent.metadata?.reference
          if (reference) await markDonationFailed(reference)
        }

        if (event.type === 'invoice.paid') {
          const invoice = event.data.object as Stripe.Invoice
          if (invoice.billing_reason === 'subscription_cycle') {
            const invoiceRecord = invoice as unknown as {
              subscription?: string | { id?: string }
              parent?: { subscription_details?: { subscription?: string } }
            }
            const subscriptionId =
              typeof invoiceRecord.subscription === 'string'
                ? invoiceRecord.subscription
                : invoiceRecord.subscription?.id ?? invoiceRecord.parent?.subscription_details?.subscription
            if (subscriptionId && invoice.id) {
              await recordRecurringPayment({
                provider: 'stripe',
                externalId: subscriptionId,
                paymentId: invoice.id,
                amount: invoice.amount_paid ? invoice.amount_paid / 100 : undefined,
              })
            }
          }
        }

        if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
          const subscription = event.data.object as Stripe.Subscription
          const status =
            event.type === 'customer.subscription.deleted'
              ? 'cancelled'
              : subscription.status === 'past_due' || subscription.status === 'unpaid'
                ? 'past_due'
                : subscription.status === 'paused'
                  ? 'paused'
                  : subscription.status === 'canceled'
                    ? 'cancelled'
                    : 'active'
          await setSubscriptionStatus('stripe', subscription.id, status)
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
