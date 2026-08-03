import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { OrderFreeQuransPage } from '#/components/pages/OrderFreeQuransPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'
import { loadAllDonationProducts } from '#/lib/cms/loadDonationProduct'

export const Route = createFileRoute('/order-free-qurans')({
  validateSearch: (search: Record<string, unknown>) => ({
    product: typeof search.product === 'string' ? search.product : undefined,
    qty: typeof search.qty === 'string' || typeof search.qty === 'number' ? Number(search.qty) : undefined,
  }),
  loader: async () => {
    const [cms, products] = await Promise.all([loadCmsSnapshot(), loadAllDonationProducts()])
    return { cms, products }
  },
  head: () => ({
    meta: [
      { title: 'Order Free Qur’ans — Donate Quran' },
      {
        name: 'description',
        content: 'Request a free Qur’an copy. Provide your delivery details and our team will fulfil your request.',
      },
    ],
  }),
  component: OrderFreeQuransRoute,
})

function OrderFreeQuransRoute() {
  const { cms, products } = Route.useLoaderData()
  const search = Route.useSearch()
  return (
    <PublicLayout data={cms}>
      <OrderFreeQuransPage
        products={products}
        initialSlug={search.product}
        initialQuantity={Number.isFinite(search.qty) && (search.qty ?? 0) > 0 ? search.qty : 1}
      />
    </PublicLayout>
  )
}
