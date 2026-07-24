import { createFileRoute, notFound } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { QuranEditionPage } from '#/components/pages/QuranEditionPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'
import { loadQuranEditionBySlug } from '#/lib/cms/loadQuranEditions'

export const Route = createFileRoute('/quran/$slug')({
  loader: async ({ params }) => {
    const [cms, edition] = await Promise.all([
      loadCmsSnapshot(),
      loadQuranEditionBySlug({ data: { slug: params.slug } }),
    ])
    if (!edition) throw notFound()
    return { cms, edition }
  },
  component: QuranEditionRoute,
})

function QuranEditionRoute() {
  const { cms, edition } = Route.useLoaderData()
  return (
    <PublicLayout data={cms}>
      <QuranEditionPage edition={edition} />
    </PublicLayout>
  )
}
