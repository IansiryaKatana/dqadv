import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { cn } from '#/lib/utils'

type SectionHeaderRowProps = {
  children: React.ReactNode
  viewAllHref?: string
  viewAllLabel?: string
  trailing?: React.ReactNode
  trailingWrapperClassName?: string
  className?: string
  viewAllClassName?: string
  layout?: 'split' | 'center'
}

export function ViewAllLink({
  href,
  label,
  className,
}: {
  href: string
  label: string
  className?: string
}) {
  return (
    <Link
      to={href}
      className={cn(
        'type-label inline-flex items-center gap-1.5 text-dq-gold transition-colors hover:text-dq-black',
        className,
      )}
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  )
}

export function SectionHeaderRow({
  children,
  viewAllHref,
  viewAllLabel = 'View All',
  trailing,
  trailingWrapperClassName,
  className,
  viewAllClassName,
  layout = 'split',
}: SectionHeaderRowProps) {
  if (layout === 'center') {
    return (
      <div className={cn('mb-10 flex flex-col items-center gap-5 text-center', className)}>
        <div className="min-w-0">{children}</div>
        {(trailing || viewAllHref) && (
          <div className="flex items-center justify-center gap-3">
            {trailing}
            {viewAllHref ? <ViewAllLink href={viewAllHref} label={viewAllLabel} className={viewAllClassName} /> : null}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between', className)}>
      <div className="min-w-0 md:flex-1">{children}</div>
      {(trailing || viewAllHref) && (
        <div
          className={cn(
            'flex w-full shrink-0 items-center justify-between gap-3 md:w-auto md:justify-end',
            trailingWrapperClassName,
          )}
        >
          {trailing}
          {viewAllHref ? <ViewAllLink href={viewAllHref} label={viewAllLabel} className={viewAllClassName} /> : null}
        </div>
      )}
    </div>
  )
}
