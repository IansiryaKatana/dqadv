import type { QuranEdition } from '#/lib/cms/types'
import { PageHero } from '#/components/layout/PageHero'
import { DonationCtaBanner } from '#/components/layout/DonationCtaBanner'
import { Container } from '#/components/ui/container'
import { ResponsiveCardGrid } from '#/components/ui/responsive-card-grid'
import { QuranEditionCard } from '#/components/cards/QuranEditionCard'

export function QuranPage({ editions }: { editions: QuranEdition[] }) {
  return (
    <>
      <PageHero
        eyebrow="Read & download"
        title="The Qur'an in"
        highlight="your language"
        description="Download or read the Qur'an in PDF format in various languages."
        variant="cream"
      />
      <section className="bg-white py-16 md:py-24">
        <Container>
          {editions.length === 0 ? (
            <p className="type-body text-center text-dq-muted">Editions coming soon.</p>
          ) : (
            <ResponsiveCardGrid
              items={editions}
              getKey={(edition) => edition.id}
              renderItem={(edition) => <QuranEditionCard edition={edition} />}
              gapClass="gap-6 lg:gap-8"
              carouselLabel="Qur'an editions"
              desktopColumns={4}
              desktopBatchSize={8}
              desktopDividers
            />
          )}
        </Container>
      </section>
      <DonationCtaBanner />
    </>
  )
}
