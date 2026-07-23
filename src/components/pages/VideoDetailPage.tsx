import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import type { FeaturedVideo } from '#/lib/cms/types'
import { Container } from '#/components/ui/container'
import { VideoCard } from '#/components/cards/VideoCard'
import { VideoPlayer } from '#/components/media/VideoPlayer'
import { DonationCtaBanner } from '#/components/layout/DonationCtaBanner'

export function VideoDetailPage({ video, related }: { video: FeaturedVideo; related: FeaturedVideo[] }) {
  return (
    <>
      <section className="bg-dq-soft-black py-8 md:py-12">
        <Container>
          <Link
            to="/videos"
            className="type-label mb-6 inline-flex items-center gap-2 text-white/70 hover:text-dq-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            All videos
          </Link>
          <VideoPlayer video={video} className="mb-6" />
          <h1 className="type-headline text-white">{video.title}</h1>
          {video.duration ? <p className="mt-2 text-sm text-white/60">{video.duration}</p> : null}
          <p className="type-body mt-4 max-w-3xl text-white/75">{video.description}</p>
        </Container>
      </section>
      {related.length > 0 ? (
        <section className="bg-white py-12">
          <Container>
            <h2 className="type-title mb-6 text-dq-black">More videos</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {related.map((v) => (
                <VideoCard key={v.id} video={v} showDetails={false} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
      <DonationCtaBanner />
    </>
  )
}
