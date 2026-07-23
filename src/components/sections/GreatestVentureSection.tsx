import { useCallback, useEffect, useMemo, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import AutoScroll from 'embla-carousel-auto-scroll'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'
import type { VentureImage, VentureSection } from '#/lib/cms/types'
import { SectionHeading } from '#/components/ui/section-heading'
import { SectionHeaderRow } from '#/components/ui/section-header-row'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

type Props = {
  section: VentureSection
  images: VentureImage[]
}

/** 1 / 2 / 5 visible; pl-4 gap baked into each slide */
const slideClassName =
  'min-w-0 shrink-0 grow-0 pl-4 basis-[calc(100vw-2.5rem)] sm:basis-[calc((100vw-3rem)/2)] lg:basis-[calc((100vw-7.5rem)/5)]'

const fullBleedX = 'px-5 md:px-8 lg:px-10 xl:px-12'

export function GreatestVentureSection({ section, images, className }: Props & { className?: string }) {
  const autoScroll = useMemo(
    () =>
      AutoScroll({
        playOnInit: true,
        speed: 0.8,
        startDelay: 0,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        stopOnFocusIn: true,
      }),
    [],
  )

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { align: 'start', loop: true, dragFree: true },
    [autoScroll],
  )
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const sourceSlides = images.filter((image) => image.imageUrl?.trim())
  // Duplicate so loop/marquee stays seamless when there are few images
  const slides =
    sourceSlides.length > 0 && sourceSlides.length < 10
      ? [...sourceSlides, ...sourceSlides, ...sourceSlides]
      : sourceSlides

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

  const carouselControls = (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        disabled={!canPrev}
        onClick={() => emblaApi?.scrollPrev()}
        aria-label="Previous venture images"
        className="border-white/20 text-white hover:bg-white/10"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        disabled={!canNext}
        onClick={() => emblaApi?.scrollNext()}
        aria-label="Next venture images"
        className="border-white/20 text-white hover:bg-white/10"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )

  return (
    <section className={cn('relative z-[3] w-full overflow-hidden bg-dq-soft-black py-16 text-white md:py-24', className)}>
      <div className={`relative mb-10 w-full ${fullBleedX}`}>
        <SectionHeaderRow trailing={carouselControls} trailingWrapperClassName="hidden md:flex" className="mb-4">
          <SectionHeading
            dark
            title={section.heading}
            highlight={section.highlightWord}
            subtitle={section.subtitle}
            subtitleOnNewLine={false}
            headingClassName="md:whitespace-nowrap"
          />
        </SectionHeaderRow>
        <p className="type-body max-w-2xl text-white/75">{section.description}</p>
      </div>

      <div className={`w-full ${fullBleedX}`}>
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex touch-pan-y">
            {slides.map((image, i) => (
              <motion.div
                key={`${image.id}-${i}`}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, sourceSlides.length) * 0.05 }}
                className={slideClassName}
              >
                <div className="overflow-hidden rounded-2xl border-2 border-dq-gold shadow-lg">
                  <img
                    src={image.imageUrl}
                    alt={image.alt}
                    className="aspect-[4/5] h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-start md:hidden">{carouselControls}</div>
      </div>
    </section>
  )
}
