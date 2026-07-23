import { Link } from '@tanstack/react-router'
import { Container } from '#/components/ui/container'
import { Button } from '#/components/ui/button'

type DonationCtaBannerProps = {
  title?: string
  description?: string
  ctaLabel?: string
  ctaHref?: string
}

export function DonationCtaBanner({
  title = 'Multiply your impact today',
  description = "Every gift places a Qur'an in the hands of someone seeking guidance. Join thousands of donors making a difference worldwide.",
  ctaLabel = 'START YOUR GIFT',
  ctaHref = '/donate',
}: DonationCtaBannerProps) {
  return (
    <section className="bg-dq-black py-12 md:py-16">
      <Container className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
        <div className="max-w-xl space-y-2">
          <h2 className="type-title text-white">{title}</h2>
          <p className="type-body text-white/70">{description}</p>
        </div>
        <Button asChild variant="gold" size="lg" className="shrink-0">
          <Link to={ctaHref}>{ctaLabel}</Link>
        </Button>
      </Container>
    </section>
  )
}
