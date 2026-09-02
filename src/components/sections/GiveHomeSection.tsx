import type { DonatePreset } from '#/lib/commerce/donateAmounts'
import { GiveCheckoutForm } from '#/components/commerce/GiveCheckoutForm'
import { Container } from '#/components/ui/container'
import { SectionHeading } from '#/components/ui/section-heading'

export function GiveHomeSection({ presets }: { presets: DonatePreset[] }) {
  return (
    <section className="bg-dq-cream/50 py-16 md:py-24">
      <Container className="max-w-2xl">
        <SectionHeading title="Give" highlight="now" className="mb-4" />
        <p className="type-body mb-8 text-dq-muted">
          Choose an amount as a one-time or monthly gift. To have printed copies posted in the UK, order a Qur’an.
        </p>
        <GiveCheckoutForm presets={presets} compact />
      </Container>
    </section>
  )
}
