import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { DonatePage } from '#/components/pages/DonatePage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'
import { loadAllDonationProducts } from '#/lib/cms/loadDonationProduct'

export const Route = createFileRoute('/donate/')({
  loader: async () => {
    const [cms, products] = await Promise.all([loadCmsSnapshot(), loadAllDonationProducts()])
    return {
      cms,
      trust: cms.trust,
      products: products.filter((p) => p.kind === 'product'),
    }
  },
  head: () => ({
    meta: [
      { title: 'Give — Donate Quran' },
      { name: 'description', content: "Choose your gift and sponsor Qur'an distribution worldwide." },
    ],
  }),
  component: DonateRoute,
})

function DonateRoute() {
  const { cms, trust, products } = Route.useLoaderData()
  return (
    <PublicLayout data={cms}>
      <DonatePage products={products} trust={trust} />
    </PublicLayout>
  )
}
