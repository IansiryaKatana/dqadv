import type { TrustBlock } from '#/lib/cms/types'
import { Container } from '#/components/ui/container'
import { SectionHeading } from '#/components/ui/section-heading'
import { cn } from '#/lib/utils'

export type TrustSectionVariant = 'light' | 'cream' | 'dark'

export const trustSectionVariantClass: Record<TrustSectionVariant, string> = {
  cream: 'bg-dq-cream/40',
  light: 'bg-white',
  dark: 'bg-dq-soft-black',
}

type TrustBlockContentProps = {
  block: TrustBlock
  variant?: TrustSectionVariant
  compact?: boolean
}

export function TrustBlockContent({ block, variant = 'light', compact }: TrustBlockContentProps) {
  const isDark = variant === 'dark'

  return (
    <>
      <SectionHeading
        title={block.title}
        dark={isDark}
        className={cn(compact ? 'mb-5 max-w-none text-xl md:text-2xl' : 'mb-8 max-w-3xl')}
      />
      <div
        className={cn(
          'prose-dq [&_p]:type-body',
          compact ? 'max-w-none [&_p]:text-sm' : 'max-w-3xl',
          isDark ? '[&_p]:text-white/75 [&_strong]:text-white' : '[&_p]:text-dq-muted',
        )}
        dangerouslySetInnerHTML={{ __html: block.bodyHtml }}
      />
      {Array.isArray(block.extra?.bullets) ? (
        <ul className={cn('mt-6 space-y-2', compact ? 'max-w-none' : 'max-w-3xl')}>
          {(block.extra.bullets as string[]).map((item) => (
            <li key={item} className={cn('type-body flex gap-2', isDark ? 'text-white/75' : 'text-dq-muted', compact && 'text-sm')}>
              <span className="text-dq-gold">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  )
}

type TrustHtmlSectionProps = {
  block: TrustBlock
  variant?: TrustSectionVariant
  id?: string
  className?: string
}

export function TrustHtmlSection({ block, variant = 'light', id, className }: TrustHtmlSectionProps) {
  return (
    <section
      id={id}
      className={cn('py-16 md:py-24', trustSectionVariantClass[variant], className)}
    >
      <Container>
        <TrustBlockContent block={block} variant={variant} />
      </Container>
    </section>
  )
}
