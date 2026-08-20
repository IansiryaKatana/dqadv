import { useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ListFilter, Search, X } from 'lucide-react'
import type { Book } from '#/lib/cms/types'
import { PageHero } from '#/components/layout/PageHero'
import { DonationCtaBanner } from '#/components/layout/DonationCtaBanner'
import { BookCard } from '#/components/cards/BookCard'
import { ExpandableGrid } from '#/components/ui/expandable-grid'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

const fullBleedX = 'px-5 md:px-8 lg:px-10 xl:px-12'

type CategoryItem = { name: string; count: number }

function BookSearchField({
  query,
  onQueryChange,
  compact = false,
}: {
  query: string
  onQueryChange: (value: string) => void
  compact?: boolean
}) {
  return (
    <label className="relative block">
      <span className="sr-only">Search books</span>
      <Search
        className={cn(
          'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-dq-muted',
          compact ? 'left-3' : 'left-4',
        )}
      />
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search books…"
        className={cn(
          'w-full rounded-md border-2 border-dq-border bg-white type-body text-dq-black outline-none transition-colors placeholder:text-dq-muted focus:border-dq-gold focus-visible:outline-none',
          compact ? 'py-2.5 pl-10 pr-3' : 'py-3 pl-11 pr-4',
        )}
      />
    </label>
  )
}

function CategoryNav({
  categories,
  activeCategory,
  onSelect,
}: {
  categories: CategoryItem[]
  activeCategory: string
  onSelect: (name: string) => void
}) {
  return (
    <nav aria-label="Book categories" className="flex flex-col gap-1">
      {categories.map((cat) => {
        const active = activeCategory === cat.name
        return (
          <button
            key={cat.name}
            type="button"
            onClick={() => onSelect(cat.name)}
            className={cn(
              'type-label flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors',
              active ? 'bg-dq-gold text-dq-on-gold' : 'text-dq-black hover:bg-dq-cream',
            )}
          >
            <span className={cn(!active && 'normal-case tracking-normal')}>{cat.name}</span>
            <span
              className={cn(
                'inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
                active ? 'bg-dq-black text-white' : 'bg-dq-cream text-dq-muted',
              )}
            >
              {cat.count}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

export function BooksPage({ books }: { books: Book[] }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const normalizedQuery = query.trim().toLowerCase()

  const searchedBooks = useMemo(() => {
    if (!normalizedQuery) return books
    return books.filter((book) => {
      const haystack = `${book.title} ${book.excerpt} ${book.category} ${book.authorName}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [books, normalizedQuery])

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const book of searchedBooks) {
      counts.set(book.category, (counts.get(book.category) ?? 0) + 1)
    }
    return [
      { name: 'All', count: searchedBooks.length },
      ...[...counts.entries()].map(([name, count]) => ({ name, count })),
    ]
  }, [searchedBooks])

  const activeCategoryExists = categories.some((cat) => cat.name === category)
  const effectiveCategory = activeCategoryExists ? category : 'All'
  const visibleBooks =
    effectiveCategory === 'All'
      ? searchedBooks
      : searchedBooks.filter((b) => b.category === effectiveCategory)

  function selectCategory(name: string) {
    setCategory(name)
    setFiltersOpen(false)
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    setCategory('All')
  }

  return (
    <>
      <PageHero
        eyebrow="Explore"
        title="Books of the"
        highlight="Qur'an"
        description="Featured surahs and thematic guides — written to help you understand and reflect on the Book of Allah."
        variant="cream"
      />

      <section className={cn('w-full bg-white py-16 md:py-24', fullBleedX)}>
        <div className="mb-8 space-y-3 lg:hidden">
          <BookSearchField query={query} onQueryChange={handleQueryChange} />
          <Button
            type="button"
            variant="outline"
            size="md"
            className="w-full justify-between rounded-md normal-case tracking-normal"
            onClick={() => setFiltersOpen(true)}
          >
            <span className="inline-flex items-center gap-2">
              <ListFilter className="h-4 w-4 shrink-0" />
              Categories
            </span>
            <span className="truncate text-dq-muted">{effectiveCategory}</span>
          </Button>
        </div>

        <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
          <aside className="hidden w-full shrink-0 lg:block lg:w-56 xl:w-64">
            <div className="mb-6">
              <BookSearchField query={query} onQueryChange={handleQueryChange} compact />
            </div>
            <CategoryNav
              categories={categories}
              activeCategory={effectiveCategory}
              onSelect={selectCategory}
            />
          </aside>

          <div className="min-w-0 flex-1">
            {visibleBooks.length === 0 ? (
              <p className="type-body text-center text-dq-muted">
                {normalizedQuery ? 'No books match your search.' : 'No books published yet.'}
              </p>
            ) : (
              <ExpandableGrid
                key={`${effectiveCategory}-${normalizedQuery}`}
                items={visibleBooks}
                getKey={(book) => book.id}
                renderItem={(book) => <BookCard book={book} />}
                mode="paginate"
                pageSize={6}
                gridClassName="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3"
              />
            )}
          </div>
        </div>
      </section>

      <Dialog.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40 lg:hidden" />
          <Dialog.Content
            className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[85dvh] flex-col rounded-t-2xl bg-white shadow-2xl outline-none lg:hidden"
            aria-describedby={undefined}
          >
            <div className="flex items-center justify-between border-b border-dq-border px-5 py-4">
              <Dialog.Title className="type-title text-dq-black">Categories</Dialog.Title>
              <Dialog.Close
                className="rounded-full p-2 text-dq-black transition-colors hover:bg-dq-cream"
                aria-label="Close categories"
              >
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <CategoryNav
                categories={categories}
                activeCategory={effectiveCategory}
                onSelect={selectCategory}
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <DonationCtaBanner />
    </>
  )
}
