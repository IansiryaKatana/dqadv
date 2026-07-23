import { createFileRoute } from '@tanstack/react-router'
import { markDonationPaid } from '#/lib/commerce/markDonationPaid'
import { verifyPayPalWebhook } from '#/lib/commerce/paypal'

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
            supplementary_data?: { related_ids?: { order_id?: string } }
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

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
