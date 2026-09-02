import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { animate, motion, useInView } from 'motion/react'
import type { HeroContent } from '#/lib/cms/types'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

const COPIES_DONATED = 875_000

function heroBackgroundSources(hero: HeroContent) {
  const desktop = hero.imageUrl
  const tablet = hero.imageUrlTablet?.trim() || desktop
  const mobile = hero.imageUrlMobile?.trim() || tablet || desktop
  return { desktop, tablet, mobile }
}

function CopiesDonatedMeter({ value = COPIES_DONATED }: { value?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.4 })
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    if (!isInView) return
    const controls = animate(0, value, {
      duration: 2.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest).toLocaleString('en-US')),
    })
    return () => controls.stop()
  }, [isInView, value])

  return (
    <div
      ref={ref}
      className="mt-8 max-w-sm"
      aria-label={`${value.toLocaleString('en-US')} copies donated`}
    >
      <p className="type-headline tabular-nums text-dq-black">{display}</p>
      <p className="type-eyebrow mt-2.5 text-dq-gold">Copies donated</p>
      <div className="mt-3 h-px w-full max-w-[11rem] overflow-hidden bg-dq-border" aria-hidden>
        <motion.div
          className="h-full origin-left bg-dq-gold"
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  )
}

export function HeroSection({ hero, className }: { hero: HeroContent; className?: string }) {
  const { desktop, tablet, mobile } = heroBackgroundSources(hero)

  return (
    <section className={cn('relative h-dvh overflow-hidden', className)}>
      {desktop ? (
        <picture className="absolute inset-0">
          <source media="(min-width: 1024px)" srcSet={desktop} />
          <source media="(min-width: 768px)" srcSet={tablet} />
          <img
            src={mobile}
            alt=""
            aria-hidden
            className="h-full w-full object-cover object-[center_right] md:object-right"
          />
        </picture>
      ) : null}
      <div className="relative flex h-full w-full items-start px-5 py-10 md:items-center md:px-8 md:py-16 lg:px-10 xl:px-12">
        <motion.div
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl"
        >
          <h1 className="type-display text-dq-black">
            {hero.titleLine1}
            <br />
            {hero.titleLine2}
            <br />
            <span className="text-dq-gold">{hero.highlightWord}</span>
          </h1>
          <p className="type-body mt-8 max-w-lg text-dq-muted">{hero.description}</p>
          <CopiesDonatedMeter />
          <div className="mt-10 flex flex-nowrap items-center gap-2 md:gap-5">
            <Button
              asChild
              variant="black"
              size="lg"
              className="h-10 shrink-0 px-3.5 text-[0.625rem] tracking-[0.1em] md:h-12 md:px-8 md:text-sm md:tracking-[0.18em]"
            >
              <Link to={hero.primaryCtaUrl} className="whitespace-nowrap">
                {hero.primaryCtaLabel}
              </Link>
            </Button>
            <Button
              asChild
              variant="gold"
              size="lg"
              className="h-10 shrink-0 px-3.5 text-[0.625rem] tracking-[0.1em] md:h-12 md:px-8 md:text-sm md:tracking-[0.18em]"
            >
              <Link to={hero.secondaryCtaUrl} className="whitespace-nowrap">
                {hero.secondaryCtaLabel}
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
