import { createServerFn } from '@tanstack/react-start'

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
