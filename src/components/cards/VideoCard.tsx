import { Link } from '@tanstack/react-router'
import { Play } from 'lucide-react'
import { motion } from 'motion/react'
import type { FeaturedVideo } from '#/lib/cms/types'

export function VideoCard({ video, showDetails = true }: { video: FeaturedVideo; showDetails?: boolean }) {
  return (
    <motion.article whileHover={{ y: -4 }} className="group">
      <Link to={`/videos/${video.slug}`} className="relative block overflow-hidden rounded-lg">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-dq-gold text-dq-on-gold">
            <Play className="h-6 w-6 fill-current" />
          </span>
        </span>
        {video.duration ? (
          <span className="absolute bottom-3 right-3 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
            {video.duration}
          </span>
        ) : null}
      </Link>
      {showDetails ? (
        <div className="mt-5 space-y-2">
          <Link to={`/videos/${video.slug}`} className="block">
            <h3 className="type-title line-clamp-1 text-dq-black transition-colors group-hover:text-dq-gold">{video.title}</h3>
          </Link>
          <p className="type-body line-clamp-2 text-dq-muted">{video.description}</p>
        </div>
      ) : null}
    </motion.article>
  )
}
