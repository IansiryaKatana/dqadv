import { createFileRoute, notFound } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { DonateProductPage } from '#/components/pages/DonateProductPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'
import { loadAllDonationProducts, loadDonationProductBySlug } from '#/lib/cms/loadDonationProduct'

export const Route = createFileRoute('/donate/$slug')({
  loader: async ({ params }) => {
    const [cms, product, allProducts] = await Promise.all([
      loadCmsSnapshot(),
      loadDonationProductBySlug(params.slug),
      loadAllDonationProducts(),
    ])
    if (!product) throw notFound()
    const related = allProducts.filter((p) => p.id !== product.id && p.kind === product.kind).slice(0, 3)
    return { cms, product, related }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.title ?? 'Gift'} — Donate Quran` },
      { name: 'description', content: loaderData?.product.description },
    ],
  }),
  component: DonateProductRoute,
})

function DonateProductRoute() {
  const { cms, product, related } = Route.useLoaderData()
  return (
    <PublicLayout data={cms}>
      <DonateProductPage product={product} related={related} />
    </PublicLayout>
  )
}
