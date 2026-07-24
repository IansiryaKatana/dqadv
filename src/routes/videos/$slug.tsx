import { createFileRoute, notFound } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { VideoDetailPage } from '#/components/pages/VideoDetailPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'
import { loadFeaturedVideoBySlug, loadFeaturedVideos } from '#/lib/cms/loadVideos'

export const Route = createFileRoute('/videos/$slug')({
  loader: async ({ params }) => {
    const [cms, video, all] = await Promise.all([
      loadCmsSnapshot(),
      loadFeaturedVideoBySlug({ data: { slug: params.slug } }),
      loadFeaturedVideos(),
    ])
    if (!video) throw notFound()
    return { cms, video, related: all.filter((v) => v.id !== video.id).slice(0, 4) }
  },
  component: VideoDetailRoute,
})

function VideoDetailRoute() {
  const { cms, video, related } = Route.useLoaderData()
  return (
    <PublicLayout data={cms}>
      <VideoDetailPage video={video} related={related} />
    </PublicLayout>
  )
}
