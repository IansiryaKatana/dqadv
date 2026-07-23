import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { VideosPage } from '#/components/pages/VideosPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'
import { loadFeaturedVideos } from '#/lib/cms/loadVideos'

export const Route = createFileRoute('/videos/')({
  loader: async () => {
    const [cms, videos] = await Promise.all([loadCmsSnapshot(), loadFeaturedVideos()])
    return { cms, videos }
  },
  head: () => ({ meta: [{ title: 'Featured Videos — Donate Quran' }] }),
  component: VideosRoute,
})

function VideosRoute() {
  const { cms, videos } = Route.useLoaderData()
  return (
    <PublicLayout data={cms}>
      <VideosPage videos={videos} />
    </PublicLayout>
  )
}
