import { createFileRoute, redirect } from '@tanstack/react-router'
import { capturePayPalCheckout } from '#/lib/commerce/createPayPalOrder'

export const Route = createFileRoute('/donate/checkout/paypal-return')({
  validateSearch: (search: Record<string, unknown>) => ({
    reference: typeof search.reference === 'string' ? search.reference : undefined,
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  beforeLoad: async ({ search }) => {
    if (!search.reference || !search.token) {
      throw redirect({ to: '/donate/checkout/cancel' })
    }

    await capturePayPalCheckout({
      data: { orderId: search.token, reference: search.reference },
    })

    throw redirect({
      to: '/donate/checkout/success',
      search: { reference: search.reference },
    })
  },
})
