import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Link } from '@tanstack/react-router'
import { Play, X } from 'lucide-react'
import { motion } from 'motion/react'
import type { StoryPoster } from '#/lib/cms/types'
import {
  extractYouTubeVideoId,
  isAutoYouTubePoster,
  resolveStoryPosterUrl,
  youTubeEmbedUrl,
  youTubeThumbnailUrl,
} from '#/lib/media/youtube'
import { cn } from '#/lib/utils'

type StoryCardProps = {
  story: StoryPoster
  shape?: 'circle' | 'poster'
  className?: string
}

const shapeClasses = {
  circle:
    'aspect-square w-full rounded-full ring-2 ring-dq-gold/35 ring-offset-2 ring-offset-white',
  poster: 'aspect-[9/16] w-full rounded-2xl',
} as const

const mediaCoverClass = 'absolute inset-0 h-full w-full object-cover'

export function StoryCard({ story, shape = 'circle', className }: StoryCardProps) {
  const [open, setOpen] = useState(false)
  const [posterSrc, setPosterSrc] = useState(() => resolveStoryPosterUrl(story))

  const videoUrl = story.videoUrl?.trim() || ''
  const youTubeId = videoUrl ? extractYouTubeVideoId(videoUrl) : null
  const hasVideo = Boolean(videoUrl)
  const usesVideoFramePoster = hasVideo && !youTubeId && !story.imageUrl?.trim()

  useEffect(() => {
    setPosterSrc(resolveStoryPosterUrl(story))
  }, [story.id, story.videoUrl, story.imageUrl])

  const handlePosterError = () => {
    if (!youTubeId) return
    // Prefer HQ CDN if a stored/oar URL fails to load
    if (!isAutoYouTubePoster(posterSrc) || posterSrc.includes('oardefault')) {
      setPosterSrc(youTubeThumbnailUrl(youTubeId, 'hq', videoUrl))
    }
  }

  const card = (
    <motion.div
      whileHover={{ y: -6 }}
      className={cn(
        'relative shrink-0 snap-center overflow-hidden bg-dq-soft-black shadow-lg',
        shapeClasses[shape],
        className,
      )}
    >
      {usesVideoFramePoster ? (
        <video
          src={`${videoUrl}#t=0.1`}
          className={cn(mediaCoverClass, shape === 'circle' ? 'scale-110' : '')}
          muted
          playsInline
          preload="metadata"
          aria-label={story.title}
        />
      ) : (
        <img
          src={posterSrc}
          alt=""
          aria-hidden
          onError={handlePosterError}
          className={cn(mediaCoverClass, shape === 'circle' ? 'scale-110' : '')}
        />
      )}

      {hasVideo ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/30"
          aria-label={`Play ${story.title}`}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-dq-gold text-dq-on-gold shadow-lg">
            <Play className="h-6 w-6 fill-current" />
          </span>
        </button>
      ) : null}
    </motion.div>
  )

  const trigger = hasVideo || !story.linkUrl ? card : <Link to={story.linkUrl}>{card}</Link>

  return (
    <>
      {trigger}

      {hasVideo ? (
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-[2px]" />
            <Dialog.Content
              className="fixed left-1/2 top-1/2 z-[70] flex w-[min(100vw-2rem,420px)] -translate-x-1/2 -translate-y-1/2 flex-col outline-none"
              aria-describedby={undefined}
              onOpenAutoFocus={(event) => event.preventDefault()}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <Dialog.Title className="type-title min-w-0 flex-1 text-white">
                  {story.title}
                </Dialog.Title>
                <Dialog.Close
                  className="shrink-0 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                  aria-label="Close video"
                >
                  <X className="h-5 w-5" />
                </Dialog.Close>
              </div>

              <div className="relative mx-auto aspect-[9/16] h-[min(80dvh,720px)] w-auto max-w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
                {open ? (
                  youTubeId ? (
                    <iframe
                      src={youTubeEmbedUrl(youTubeId, {
                        autoplay: true,
                        controls: true,
                        loop: true,
                        mute: false,
                      })}
                      title={story.title}
                      className="absolute inset-0 h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={videoUrl}
                      className="absolute inset-0 h-full w-full object-contain"
                      controls
                      autoPlay
                      playsInline
                      loop
                    />
                  )
                ) : null}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null}
    </>
  )
}
