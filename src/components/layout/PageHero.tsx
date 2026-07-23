import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Container } from '#/components/ui/container'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

type PageHeroProps = {
  eyebrow?: string
  title: string
  highlight?: string
  subtitle?: string
  description?: string
  imageUrl?: string
  variant?: 'light' | 'dark' | 'cream'
  primaryCta?: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  children?: ReactNode
  className?: string
}

export function PageHero({
  eyebrow,
  title,
  highlight,
  subtitle,
  description,
  imageUrl,
  variant = 'cream',
  primaryCta,
  secondaryCta,
  children,
  className,
}: PageHeroProps) {
  const isDark = variant === 'dark'

  return (
    <section
      className={cn(
        'relative overflow-hidden py-16 md:py-24',
        variant === 'cream' && 'bg-dq-cream/50',
        variant === 'light' && 'bg-white',
        variant === 'dark' && 'bg-dq-soft-black',
        className,
      )}
    >
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-dq-soft-black/90 via-dq-soft-black/70 to-transparent" />
        </>
      ) : null}

      <Container className="relative">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          {eyebrow ? (
            <p className={cn('type-eyebrow mb-3', isDark ? 'text-dq-gold' : 'text-dq-muted')}>{eyebrow}</p>
          ) : null}
          <h1 className={cn('type-headline', isDark ? 'text-white' : 'text-dq-black')}>
            {title}
            {highlight ? (
              <>
                {' '}
                <span className="text-dq-gold">{highlight}</span>
              </>
            ) : null}
            {subtitle ? (
              <>
                <br />
                <span className={isDark ? 'text-white' : 'text-dq-black'}>{subtitle}</span>
              </>
            ) : null}
          </h1>
          {description ? (
            <p className={cn('type-body mt-6 max-w-xl', isDark ? 'text-white/75' : 'text-dq-muted')}>
              {description}
            </p>
          ) : null}
          {children ? <div className="mt-6 max-w-xl">{children}</div> : null}
          {(primaryCta || secondaryCta) && (
            <div className="mt-8 flex flex-wrap gap-3">
              {primaryCta ? (
                <Button asChild variant={isDark ? 'gold' : 'black'} size="md">
                  <Link to={primaryCta.href}>{primaryCta.label}</Link>
                </Button>
              ) : null}
              {secondaryCta ? (
                <Button asChild variant={isDark ? 'outlineOnDark' : 'outline'} size="md">
                  <Link to={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              ) : null}
            </div>
          )}
        </motion.div>
      </Container>
    </section>
  )
}
