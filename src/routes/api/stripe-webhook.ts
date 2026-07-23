import { createFileRoute } from '@tanstack/react-router'
import Stripe from 'stripe'
import { loadIntegrationSettings } from '#/lib/integrations/paymentConfig'
import { markDonationFailed, markDonationPaid } from '#/lib/commerce/markDonationPaid'

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
            await markDonationPaid({
              reference,
              paymentProvider: 'stripe',
              externalId: session.payment_intent?.toString() ?? session.id,
              stripeSessionId: session.id,
            })
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

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
