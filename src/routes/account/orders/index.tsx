import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { AccountOrdersPage } from '#/components/pages/AccountOrdersPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'

export const Route = createFileRoute('/account/orders/')({
  loader: () => loadCmsSnapshot(),
  head: () => ({ meta: [{ title: 'My Gifts — Donate Quran' }] }),
  component: OrdersRoute,
})

function OrdersRoute() {
  const data = Route.useLoaderData()
  return (
    <PublicLayout data={data}>
      <AccountOrdersPage />
    </PublicLayout>
  )
}
