import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { DonationProduct } from '#/lib/cms/types'
import { Container } from '#/components/ui/container'
import { SectionHeading } from '#/components/ui/section-heading'
import { SectionHeaderRow, ViewAllLink } from '#/components/ui/section-header-row'
import { QuickDonationCard } from '#/components/cards/QuickDonationCard'
import { Button } from '#/components/ui/button'

const fullBleedX = 'px-5 md:px-8 lg:px-10 xl:px-12'

const carouselSlideClass =
  'min-w-0 shrink-0 grow-0 pl-4 basis-[calc(100vw-2.5rem)] md:basis-[calc((100vw-3rem)/2)]'

export function QuickDonationSection({ products }: { products: DonationProduct[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: false, dragFree: true })
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const visibleProducts = products.slice(0, 3)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanPrev(emblaApi.canScrollPrev())
    setCanNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  if (!visibleProducts.length) return null

  const carouselControls = (
    <div className="flex shrink-0 gap-2">
      <Button variant="outline" size="icon" disabled={!canPrev} onClick={() => emblaApi?.scrollPrev()} aria-label="Previous quick donations">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" disabled={!canNext} onClick={() => emblaApi?.scrollNext()} aria-label="Next quick donations">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )

  return (
    <section className="w-full bg-white py-16 md:py-24">
      <Container className="mb-10">
        <div className="mb-10 flex items-center justify-between gap-3 lg:hidden">
          <div className="min-w-0">
            <SectionHeading title="Quick" highlight="Donation" />
          </div>
          {carouselControls}
        </div>
        <SectionHeaderRow viewAllHref="/donate" className="mb-0 hidden lg:flex">
          <SectionHeading title="Quick" highlight="Donation" />
        </SectionHeaderRow>
      </Container>

      <div className={`${fullBleedX} lg:hidden`}>
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex touch-pan-y">
            {visibleProducts.map((product) => (
              <div key={product.id} className={carouselSlideClass}>
                <QuickDonationCard product={product} />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex justify-center">
          <ViewAllLink href="/donate" label="View All" />
        </div>
      </div>

      <Container className="hidden lg:block">
        <div className="grid grid-cols-3 gap-8">
          {visibleProducts.map((product) => (
            <QuickDonationCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  )
}
