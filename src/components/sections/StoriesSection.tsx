import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { StoryPoster } from '#/lib/cms/types'
import { Container } from '#/components/ui/container'
import { SectionHeading } from '#/components/ui/section-heading'
import { StoryCard } from '#/components/cards/StoryCard'
import { Button } from '#/components/ui/button'

/** 1 / 2 / 4 visible; gap-5 = 1.25rem, md:gap-6 = 1.5rem */
const slideClassName =
  'min-w-0 shrink-0 grow-0 basis-full sm:basis-[calc((100%-1.25rem)/2)] md:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-4.5rem)/4)]'

export function StoriesSection({ stories }: { stories: StoryPoster[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: false, dragFree: true })
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

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

  if (!stories.length) return null

  return (
    <section className="w-full bg-white py-16 md:py-24">
      <Container>
        <div className="mb-8 flex items-end justify-between gap-4">
          <SectionHeading title="Watch Stories," highlight="Learn, and Be Inspired" />
          <div className="hidden gap-2 sm:flex">
            <Button variant="outline" size="icon" disabled={!canPrev} onClick={() => emblaApi?.scrollPrev()} aria-label="Previous stories">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" disabled={!canNext} onClick={() => emblaApi?.scrollNext()} aria-label="Next stories">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex items-center gap-5 md:gap-6">
            {stories.map((story) => (
              <div key={story.id} className={slideClassName}>
                <StoryCard story={story} />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
