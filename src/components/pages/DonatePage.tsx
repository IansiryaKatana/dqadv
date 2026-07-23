import type { DonationProduct, TrustContent } from '#/lib/cms/types'
import { PageHero } from '#/components/layout/PageHero'
import { DonationCtaBanner } from '#/components/layout/DonationCtaBanner'
import { Container } from '#/components/ui/container'
import { ResponsiveCardGrid } from '#/components/ui/responsive-card-grid'
import { SectionHeading } from '#/components/ui/section-heading'
import { DonationCard } from '#/components/cards/DonationCard'
import { WhyDonateSection } from '#/components/sections/trust/WhyDonateSection'
import { BankPaymentSection } from '#/components/sections/trust/BankPaymentSection'
import { TrustHtmlSection } from '#/components/sections/trust/TrustHtmlSection'

type DonatePageProps = {
  products: DonationProduct[]
  trust: TrustContent
}

export function DonatePage({ products, trust }: DonatePageProps) {
  return (
    <>
      <PageHero
        eyebrow="Give"
        title="Choose your"
        highlight="Gift"
        description="Select a sponsorship or Qur'an package below. Every gift you add places sacred knowledge in the hands of someone seeking guidance."
        variant="cream"
      />

      {trust.byKey.hundred_percent_promise ? (
        <TrustHtmlSection block={trust.byKey.hundred_percent_promise} variant="light" />
      ) : null}

      {products.length > 0 ? (
        <section className="bg-dq-cream/40 py-16 md:py-24">
          <Container>
            <SectionHeading title="Our" highlight="Products" className="mb-10" />
            <ResponsiveCardGrid
              items={products}
              getKey={(product) => product.id}
              renderItem={(product) => <DonationCard product={product} />}
              gapClass="gap-6"
              carouselLabel="our products"
            />
          </Container>
        </section>
      ) : null}

      <WhyDonateSection trust={trust} />

      {trust.byKey.bank_payment ? <BankPaymentSection block={trust.byKey.bank_payment} /> : null}

      <DonationCtaBanner
        title="Not sure where to start?"
        description="A single Qur'an sponsorship is the most direct way to make an impact. Your gift reaches someone ready to learn."
        ctaLabel="SPONSOR ONE QUR'AN"
        ctaHref="/donate/single-quran-request"
      />
    </>
  )
}
