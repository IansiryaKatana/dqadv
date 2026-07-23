import type { FeaturedVideo } from '#/lib/cms/types'
import { extractYouTubeVideoId, youTubeEmbedUrl } from '#/lib/media/youtube'
import { cn } from '#/lib/utils'

export function VideoPlayer({ video, className }: { video: FeaturedVideo; className?: string }) {
  if (video.videoType === 'youtube') {
    const youTubeId = extractYouTubeVideoId(video.videoUrl)
    const embedSrc = youTubeId
      ? youTubeEmbedUrl(youTubeId, { controls: true })
      : video.videoUrl

    return (
      <div className={cn('aspect-video overflow-hidden rounded-2xl bg-black', className)}>
        <iframe
          src={embedSrc}
          title={video.title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <video
      className={cn('aspect-video w-full rounded-2xl bg-black', className)}
      controls
      playsInline
      poster={video.thumbnailUrl}
      src={video.videoUrl}
    >
      <track kind="captions" />
    </video>
  )
}
