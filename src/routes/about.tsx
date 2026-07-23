import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { AboutPage } from '#/components/pages/AboutPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'

export const Route = createFileRoute('/about')({
  loader: () => loadCmsSnapshot(),
  head: () => ({
    meta: [{ title: 'About Us — Donate Quran' }],
  }),
  component: AboutRoute,
})

function AboutRoute() {
  const data = Route.useLoaderData()
  return (
    <PublicLayout data={data}>
      <AboutPage data={data} />
    </PublicLayout>
  )
}
