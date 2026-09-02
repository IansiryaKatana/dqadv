import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { OrderFreeQuransPage } from '#/components/pages/OrderFreeQuransPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'
import { loadPostageTiers } from '#/lib/commerce/catalog'

export const Route = createFileRoute('/order-free-qurans')({
  validateSearch: (search: Record<string, unknown>) => ({
    product: typeof search.product === 'string' ? search.product : undefined,
    qty: typeof search.qty === 'string' || typeof search.qty === 'number' ? Number(search.qty) : undefined,
  }),
  loader: async () => {
    const [cms, tiers] = await Promise.all([loadCmsSnapshot(), loadPostageTiers()])
    return { cms, tiers }
  },
  head: () => ({
    meta: [
      { title: 'Order a Qur’an — Donate Quran' },
      {
        name: 'description',
        content:
          'Order printed Qur’ans for UK delivery. The first copy is free; you pay postage. Extra copies include print cost plus postage.',
      },
    ],
  }),
  component: OrderFreeQuransRoute,
})

function OrderFreeQuransRoute() {
  const { cms, tiers } = Route.useLoaderData()
  const search = Route.useSearch()
  return (
    <PublicLayout data={cms}>
      <OrderFreeQuransPage
        tiers={tiers}
        postageNote={cms.trust.byKey.postage_packaging}
        initialQuantity={Number.isFinite(search.qty) && (search.qty ?? 0) > 0 ? search.qty : 1}
      />
    </PublicLayout>
  )
}
