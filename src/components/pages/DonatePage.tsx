import type { TrustContent } from '#/lib/cms/types'
import type { DonatePreset } from '#/lib/commerce/donateAmounts'
import { PageHero } from '#/components/layout/PageHero'
import { DonationCtaBanner } from '#/components/layout/DonationCtaBanner'
import { Container } from '#/components/ui/container'
import { WhyDonateSection } from '#/components/sections/trust/WhyDonateSection'
import { BankPaymentSection } from '#/components/sections/trust/BankPaymentSection'
import { TrustHtmlSection } from '#/components/sections/trust/TrustHtmlSection'
import { GiveCheckoutForm } from '#/components/commerce/GiveCheckoutForm'

type DonatePageProps = {
  presets: DonatePreset[]
  trust: TrustContent
}

export function DonatePage({ presets, trust }: DonatePageProps) {
  return (
    <>
      <PageHero
        eyebrow="Give"
        title="Support this"
        highlight="work"
        description="Choose an amount. Your gift funds printing and distribution. To have copies posted to a UK address, order a Qur’an instead."
        variant="cream"
      />

      {trust.byKey.hundred_percent_promise ? (
        <TrustHtmlSection block={trust.byKey.hundred_percent_promise} variant="light" />
      ) : null}

      <section className="bg-dq-cream/40 py-16 md:py-24">
        <Container className="max-w-2xl">
          <GiveCheckoutForm presets={presets} />
        </Container>
      </section>

      <WhyDonateSection trust={trust} />

      {trust.byKey.bank_payment ? <BankPaymentSection block={trust.byKey.bank_payment} /> : null}

      <DonationCtaBanner
        title="Need copies posted to you?"
        description="UK orders use a published postage tariff. The first Qur’an is free — you pay postage only."
        ctaLabel="ORDER A QUR'AN"
        ctaHref="/order-free-qurans"
      />
    </>
  )
}
