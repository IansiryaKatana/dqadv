import { useEffect, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

type ExpandableGridProps<T> = {
  items: T[]
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  initialCount?: number
  batchSize?: number
  pageSize?: number
  mode?: 'expand' | 'paginate'
  gridClassName?: string
  showMoreLabel?: string
  showLessLabel?: string
  controlsClassName?: string
}

function getPageNumbers(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: Array<number | 'ellipsis'> = [1]

  if (current > 3) pages.push('ellipsis')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  if (current < total - 2) pages.push('ellipsis')

  pages.push(total)
  return pages
}

export function ExpandableGrid<T>({
  items,
  getKey,
  renderItem,
  initialCount = 3,
  batchSize = 3,
  pageSize = 6,
  mode = 'expand',
  gridClassName = 'grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3',
  showMoreLabel = 'Show more',
  showLessLabel = 'Show less',
  controlsClassName,
}: ExpandableGridProps<T>) {
  const [visibleCount, setVisibleCount] = useState(initialCount)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
    setVisibleCount(initialCount)
  }, [items, initialCount])

  if (mode === 'paginate') {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
    const currentPage = Math.min(page, totalPages)
    const start = (currentPage - 1) * pageSize
    const visibleItems = items.slice(start, start + pageSize)
    const pageNumbers = getPageNumbers(currentPage, totalPages)

    return (
      <>
        <div className={cn(gridClassName, 'items-stretch')}>
          {visibleItems.map((item) => (
            <div key={getKey(item)} className="h-full">
              {renderItem(item)}
            </div>
          ))}
        </div>
        {totalPages > 1 ? (
          <nav
            aria-label="Pagination"
            className={cn('mt-10 flex flex-wrap items-center justify-center gap-2', controlsClassName)}
          >
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {pageNumbers.map((entry, index) =>
              entry === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="type-body px-1 text-dq-muted" aria-hidden>
                  …
                </span>
              ) : (
                <Button
                  key={entry}
                  type="button"
                  variant={entry === currentPage ? 'gold' : 'outline'}
                  size="icon"
                  aria-label={`Page ${entry}`}
                  aria-current={entry === currentPage ? 'page' : undefined}
                  onClick={() => setPage(entry)}
                >
                  {entry}
                </Button>
              ),
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </nav>
        ) : null}
      </>
    )
  }

  const visibleItems = items.slice(0, visibleCount)
  const hasMore = visibleCount < items.length
  const canShowLess = visibleCount > initialCount

  return (
    <>
      <div className={cn(gridClassName, 'items-stretch')}>
        {visibleItems.map((item) => (
          <div key={getKey(item)} className="h-full">
            {renderItem(item)}
          </div>
        ))}
      </div>
      {hasMore || canShowLess ? (
        <div className={cn('mt-10 flex justify-center gap-4', controlsClassName)}>
          {hasMore ? (
            <Button
              variant="outline"
              size="lg"
              onClick={() => setVisibleCount((count) => Math.min(count + batchSize, items.length))}
            >
              {showMoreLabel}
            </Button>
          ) : null}
          {canShowLess ? (
            <Button variant="outline" size="lg" onClick={() => setVisibleCount(initialCount)}>
              {showLessLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
