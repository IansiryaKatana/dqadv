import type { FeaturedVideo } from '#/lib/cms/types'
import { PageHero } from '#/components/layout/PageHero'
import { DonationCtaBanner } from '#/components/layout/DonationCtaBanner'
import { Container } from '#/components/ui/container'
import { ResponsiveCardGrid } from '#/components/ui/responsive-card-grid'
import { VideoCard } from '#/components/cards/VideoCard'

export function VideosPage({ videos }: { videos: FeaturedVideo[] }) {
  return (
    <>
      <PageHero
        eyebrow="Watch"
        title="Featured"
        highlight="Videos"
        description="Campaign films, educational content, and stories from the Donate Quran community."
        variant="cream"
      />
      <section className="bg-white py-16 md:py-24">
        {videos.length === 0 ? (
          <Container>
            <p className="type-body text-center text-dq-muted">No videos published yet.</p>
          </Container>
        ) : (
          <ResponsiveCardGrid
            items={videos}
            getKey={(video) => video.id}
            renderItem={(video) => <VideoCard video={video} />}
            gapClass="gap-6 lg:gap-8"
            carouselLabel="videos"
            desktopColumns={4}
            desktopBatchSize={8}
            fullWidth
          />
        )}
      </section>
      <DonationCtaBanner />
    </>
  )
}
