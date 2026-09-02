import { createFileRoute, redirect } from '@tanstack/react-router'
import { completePayPalReturn } from '#/lib/commerce/completePayPalReturn'

export const Route = createFileRoute('/donate/checkout/paypal-return')({
  validateSearch: (search: Record<string, unknown>) => ({
    reference: typeof search.reference === 'string' ? search.reference : undefined,
    token: typeof search.token === 'string' ? search.token : undefined,
    subscription_id: typeof search.subscription_id === 'string' ? search.subscription_id : undefined,
  }),
  beforeLoad: async ({ search }) => {
    if (!search.reference) {
      throw redirect({ to: '/donate/checkout/cancel', search: { reference: undefined } })
    }

    const result = await completePayPalReturn({
      data: {
        reference: search.reference,
        token: search.token,
        subscription_id: search.subscription_id,
      },
    })

    if (!result.ok) {
      throw redirect({ to: '/donate/checkout/cancel', search: { reference: search.reference } })
    }

    throw redirect({
      to: '/donate/checkout/success',
      search: { reference: search.reference },
    })
  },
})
