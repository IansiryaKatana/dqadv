import { cn } from '#/lib/utils'

type AdminNavBadgeProps = {
  count: number
  className?: string
}

export function AdminNavBadge({ count, className }: AdminNavBadgeProps) {
  if (count <= 0) return null

  return (
    <span
      className={cn(
        'ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-dq-gold px-1.5 text-[10px] font-semibold tabular-nums text-dq-black',
        className,
      )}
      aria-label={`${count} new`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
