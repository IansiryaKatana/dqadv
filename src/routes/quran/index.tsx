import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { QuranPage } from '#/components/pages/QuranPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'
import { loadQuranEditions } from '#/lib/cms/loadQuranEditions'

export const Route = createFileRoute('/quran/')({
  loader: async () => {
    const [cms, editions] = await Promise.all([loadCmsSnapshot(), loadQuranEditions()])
    return { cms, editions }
  },
  head: () => ({ meta: [{ title: "Read & Download the Qur'an — Donate Quran" }] }),
  component: QuranRoute,
})

function QuranRoute() {
  const { cms, editions } = Route.useLoaderData()
  return (
    <PublicLayout data={cms}>
      <QuranPage editions={editions} />
    </PublicLayout>
  )
}
