import type { TrustBlock } from '#/lib/cms/types'
import type { PostageTier } from '#/lib/commerce/quoteUkQuranOrder'
import { QuranOrderForm } from '#/components/forms/QuranOrderForm'
import { PageHero } from '#/components/layout/PageHero'
import { Container } from '#/components/ui/container'

type OrderFreeQuransPageProps = {
  tiers: PostageTier[]
  postageNote?: TrustBlock
  initialQuantity?: number
}

export function OrderFreeQuransPage({
  tiers,
  postageNote,
  initialQuantity,
}: OrderFreeQuransPageProps) {
  return (
    <>
      <PageHero
        eyebrow="UK orders"
        title="Order a"
        highlight="Qur'an"
        description="The first copy is free — you pay UK postage. Extra copies include a contribution to print cost. Delivery is within the United Kingdom only."
        variant="dark"
      />
      <section className="bg-white py-16 md:py-24">
        <Container className="max-w-3xl">
          <QuranOrderForm tiers={tiers} postageNote={postageNote} initialQuantity={initialQuantity} />
        </Container>
      </section>
    </>
  )
}
