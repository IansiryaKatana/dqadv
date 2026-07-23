import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { CheckoutCancelPage } from '#/components/pages/CheckoutCancelPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'

export const Route = createFileRoute('/donate/checkout/cancel')({
  validateSearch: (search: Record<string, unknown>) => ({
    reference: typeof search.reference === 'string' ? search.reference : undefined,
  }),
  loader: () => loadCmsSnapshot(),
  head: () => ({ meta: [{ title: 'Payment Cancelled — Donate Quran' }] }),
  component: CancelRoute,
})

function CancelRoute() {
  const data = Route.useLoaderData()
  const { reference } = Route.useSearch()
  return (
    <PublicLayout data={data}>
      <CheckoutCancelPage reference={reference} />
    </PublicLayout>
  )
}
