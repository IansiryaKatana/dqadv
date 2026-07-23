import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { CheckoutSuccessPage } from '#/components/pages/CheckoutSuccessPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'

export const Route = createFileRoute('/donate/checkout/success')({
  validateSearch: (search: Record<string, unknown>) => ({
    reference: typeof search.reference === 'string' ? search.reference : undefined,
  }),
  loader: () => loadCmsSnapshot(),
  head: () => ({ meta: [{ title: 'Thank You — Donate Quran' }] }),
  component: SuccessRoute,
})

function SuccessRoute() {
  const data = Route.useLoaderData()
  const { reference } = Route.useSearch()
  return (
    <PublicLayout data={data}>
      <CheckoutSuccessPage reference={reference} />
    </PublicLayout>
  )
}
