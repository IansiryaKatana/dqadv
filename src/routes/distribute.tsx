import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { DistributePage } from '#/components/pages/DistributePage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'

export const Route = createFileRoute('/distribute')({
  loader: () => loadCmsSnapshot(),
  head: () => ({ meta: [{ title: 'Become a Distributor — Donate Quran' }] }),
  component: DistributeRoute,
})

function DistributeRoute() {
  const data = Route.useLoaderData()
  return (
    <PublicLayout data={data}>
      <DistributePage />
    </PublicLayout>
  )
}
