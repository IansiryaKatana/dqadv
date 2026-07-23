import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { GiftCartPage } from '#/components/pages/GiftCartPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'

export const Route = createFileRoute('/donate/cart')({
  loader: () => loadCmsSnapshot(),
  head: () => ({
    meta: [{ title: 'Your Gift — Donate Quran' }],
  }),
  component: GiftCartRoute,
})

function GiftCartRoute() {
  const data = Route.useLoaderData()
  return (
    <PublicLayout data={data}>
      <GiftCartPage postageNote={data.trust.byKey.postage_packaging} />
    </PublicLayout>
  )
}
