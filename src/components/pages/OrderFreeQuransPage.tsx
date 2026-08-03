import { FreeQuranRequestForm } from '#/components/forms/FreeQuranRequestForm'
import { PageHero } from '#/components/layout/PageHero'
import { Container } from '#/components/ui/container'
import type { DonationProduct } from '#/lib/cms/types'

type OrderFreeQuransPageProps = {
  products: DonationProduct[]
  initialSlug?: string
  initialQuantity?: number
}

export function OrderFreeQuransPage({
  products,
  initialSlug,
  initialQuantity,
}: OrderFreeQuransPageProps) {
  return (
    <>
      <PageHero
        eyebrow="Free copies"
        title="Request a"
        highlight="Free Qur'an"
        description="Fill in your details and delivery address. Free copies are fulfilled by our team — no payment or gift cart required."
        variant="dark"
      />
      <section className="bg-white py-16 md:py-24">
        <Container className="max-w-3xl">
          <FreeQuranRequestForm
            products={products}
            initialSlug={initialSlug}
            initialQuantity={initialQuantity}
          />
        </Container>
      </section>
    </>
  )
}
