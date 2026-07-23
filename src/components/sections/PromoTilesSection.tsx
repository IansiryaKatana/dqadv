import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PromoTile } from '#/lib/cms/types'
import { Container } from '#/components/ui/container'
import { Button } from '#/components/ui/button'

const fullBleedX = 'px-5 md:px-8 lg:px-10 xl:px-12'

const carouselSlideClass =
  'min-w-0 shrink-0 grow-0 pl-4 basis-[calc(100vw-2.5rem)] md:basis-[calc((100vw-3rem)/2)]'

function PromoTileCard({ tile }: { tile: PromoTile }) {
  const external = /^https?:\/\//i.test(tile.linkUrl)

  return (
    <a
      href={tile.linkUrl}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className="group relative block overflow-hidden rounded-2xl shadow-md"
    >
      <img src={tile.imageUrl} alt={tile.title} className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105 md:h-56" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <p className="type-title absolute bottom-4 left-4 right-4 text-white">{tile.title}</p>
    </a>
  )
}

export function PromoTilesSection({ tiles }: { tiles: PromoTile[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: false, dragFree: true })
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const visibleTiles = tiles.filter((tile) => tile.imageUrl?.trim()).slice(0, 3)

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

  if (!visibleTiles.length) return null

  return (
    <section className="w-full bg-white pb-16 md:pb-24">
      <Container className="mb-6 hidden lg:block">
        <div className="grid grid-cols-3 gap-6">
          {visibleTiles.map((tile) => (
            <PromoTileCard key={tile.id} tile={tile} />
          ))}
        </div>
      </Container>

      <div className={`${fullBleedX} lg:hidden`}>
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex touch-pan-y">
            {visibleTiles.map((tile) => (
              <div key={tile.id} className={carouselSlideClass}>
                <PromoTileCard tile={tile} />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" size="icon" disabled={!canPrev} onClick={() => emblaApi?.scrollPrev()} aria-label="Previous promo tiles">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" disabled={!canNext} onClick={() => emblaApi?.scrollNext()} aria-label="Next promo tiles">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
