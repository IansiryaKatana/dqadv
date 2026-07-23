import type { DonationProduct } from '#/lib/cms/types'
import { Container } from '#/components/ui/container'
import { SectionHeading } from '#/components/ui/section-heading'
import { SectionHeaderRow, ViewAllLink } from '#/components/ui/section-header-row'
import { DonationCard } from '#/components/cards/DonationCard'

export function DonationProductsSection({ products }: { products: DonationProduct[] }) {
  if (!products.length) return null

  const visibleProducts = products.slice(0, 3)

  return (
    <section className="bg-dq-cream/50 py-16 md:py-24">
      <Container>
        <SectionHeaderRow viewAllHref="/donate" trailingWrapperClassName="hidden md:flex">
          <SectionHeading title="Donation" highlight="Products" />
        </SectionHeaderRow>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {visibleProducts.map((product) => (
            <DonationCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-6 flex justify-center md:hidden">
          <ViewAllLink href="/donate" label="View All" />
        </div>
      </Container>
    </section>
  )
}
