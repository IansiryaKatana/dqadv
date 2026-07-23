import type { StoryPoster } from '#/lib/cms/types'
import { PageHero } from '#/components/layout/PageHero'
import { Container } from '#/components/ui/container'
import { StoryCard } from '#/components/cards/StoryCard'
import { DonationCtaBanner } from '#/components/layout/DonationCtaBanner'

export function StoriesPage({ stories }: { stories: StoryPoster[] }) {
  return (
    <>
      <PageHero
        eyebrow="Stories"
        title="Watch, learn"
        highlight="& be inspired"
        description="Story moments from our campaigns — real Qur'an distribution and transformation in every circle."
        variant="cream"
      />
      <section className="bg-white py-16 md:py-24">
        <Container>
          <div className="grid grid-cols-1 justify-items-center gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
            {stories.map((story) => (
              <div key={story.id} className="w-full max-w-[260px]">
                <StoryCard story={story} />
              </div>
            ))}
          </div>
        </Container>
      </section>
      <DonationCtaBanner />
    </>
  )
}
