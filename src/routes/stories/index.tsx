import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { StoriesPage } from '#/components/pages/StoriesPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'
import { loadAllStories } from '#/lib/cms/loadStories'

export const Route = createFileRoute('/stories/')({
  loader: async () => {
    const [cms, stories] = await Promise.all([loadCmsSnapshot(), loadAllStories()])
    return { cms, stories }
  },
  head: () => ({ meta: [{ title: 'Stories — Donate Quran' }] }),
  component: StoriesRoute,
})

function StoriesRoute() {
  const { cms, stories } = Route.useLoaderData()
  return (
    <PublicLayout data={cms}>
      <StoriesPage stories={stories} />
    </PublicLayout>
  )
}
