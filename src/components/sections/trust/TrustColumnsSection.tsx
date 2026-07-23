import type { TrustBlock } from '#/lib/cms/types'
import { trustSectionVariantClass, type TrustSectionVariant } from './TrustHtmlSection'
import { TrustColumnCard } from './TrustColumnCard'
import { cn } from '#/lib/utils'

export type TrustColumn = {
  block: TrustBlock
  variant: TrustSectionVariant
  id?: string
}

type TrustColumnsSectionProps = {
  columns: TrustColumn[]
  className?: string
}

export function TrustColumnsSection({ columns, className }: TrustColumnsSectionProps) {
  const visible = columns.filter((column) => column.block)
  if (!visible.length) return null

  return (
    <section className={cn('overflow-hidden', className)}>
      <div
        className={cn(
          'grid grid-cols-1',
          visible.length === 2 && 'md:grid-cols-2',
          visible.length === 3 && 'md:grid-cols-3',
          visible.length >= 4 && 'md:grid-cols-2 xl:grid-cols-4',
        )}
      >
        {visible.map(({ block, variant, id }) => (
          <div
            key={block.key}
            id={id}
            className={cn(
              trustSectionVariantClass[variant],
              'flex h-full flex-col px-5 py-12 md:px-6 md:py-16 lg:px-8 xl:py-20',
            )}
          >
            <TrustColumnCard block={block} variant={variant} />
          </div>
        ))}
      </div>
    </section>
  )
}
