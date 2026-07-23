import { Link } from '@tanstack/react-router'
import type { CmsSnapshot } from '#/lib/cms/types'
import { PageHero } from '#/components/layout/PageHero'
import { GreatestVentureSection } from '#/components/sections/GreatestVentureSection'
import { WhatsInsideSection } from '#/components/sections/WhatsInsideSection'
import { DonationCtaBanner } from '#/components/layout/DonationCtaBanner'
import { TrustHtmlSection } from '#/components/sections/trust/TrustHtmlSection'
import { TrustColumnsSection } from '#/components/sections/trust/TrustColumnsSection'
import { Container } from '#/components/ui/container'
import { Button } from '#/components/ui/button'

type AboutPageProps = {
  data: Pick<CmsSnapshot, 'whatsInside' | 'ventureSection' | 'ventureImages' | 'footer' | 'trust'>
}

export function AboutPage({ data }: AboutPageProps) {
  const { trust } = data

  return (
    <>
      <PageHero
        eyebrow="About Donate Quran"
        title="Our"
        highlight="Story"
        description={data.footer.aboutText}
        variant="dark"
        primaryCta={{ label: 'GIVE NOW', href: '/donate' }}
        secondaryCta={{ label: 'BECOME A DISTRIBUTOR', href: '/distribute' }}
      />

      {trust.byKey.hundred_percent_promise ? (
        <TrustHtmlSection
          id="our-promise"
          block={trust.byKey.hundred_percent_promise}
          variant="cream"
        />
      ) : null}

      <WhatsInsideSection content={data.whatsInside} />

      <TrustColumnsSection
        columns={[
          trust.byKey.quality_standards && { block: trust.byKey.quality_standards, variant: 'light' as const },
          trust.byKey.mercy_foundation && { block: trust.byKey.mercy_foundation, variant: 'dark' as const },
          trust.byKey.mission_dawah && { block: trust.byKey.mission_dawah, variant: 'light' as const },
          trust.byKey.origin_story && { block: trust.byKey.origin_story, variant: 'cream' as const },
        ].filter(Boolean)}
      />

      <GreatestVentureSection section={data.ventureSection} images={data.ventureImages} />

      {trust.byKey.impact_testimony ? (
        <TrustHtmlSection block={trust.byKey.impact_testimony} variant="dark" />
      ) : null}

      {trust.byKey.other_projects ? (
        <TrustHtmlSection block={trust.byKey.other_projects} variant="light" />
      ) : null}

      <section className="bg-dq-cream/40 py-12 md:py-16">
        <Container className="flex flex-col items-center gap-4 text-center">
          <p className="type-body max-w-xl text-dq-muted">
            Ready to distribute Qur'ans in your community? Join our registered distributor network.
          </p>
          <Button asChild variant="gold">
            <Link to="/distribute">BECOME A DISTRIBUTOR</Link>
          </Button>
        </Container>
      </section>

      <DonationCtaBanner />
    </>
  )
}
