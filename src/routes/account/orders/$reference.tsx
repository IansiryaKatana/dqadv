import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { AccountOrderDetailPage } from '#/components/pages/AccountOrderDetailPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'

export const Route = createFileRoute('/account/orders/$reference')({
  loader: () => loadCmsSnapshot(),
  head: () => ({ meta: [{ title: 'Gift Details — Donate Quran' }] }),
  component: OrderDetailRoute,
})

function OrderDetailRoute() {
  const data = Route.useLoaderData()
  const { reference } = Route.useParams()
  return (
    <PublicLayout data={data}>
      <AccountOrderDetailPage reference={reference} />
    </PublicLayout>
  )
}
