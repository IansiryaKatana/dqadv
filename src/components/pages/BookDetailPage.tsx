import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ArrowLeft, Eye } from 'lucide-react'
import type { Book, BookDetail } from '#/lib/cms/types'
import { Badge } from '#/components/ui/badge'
import { BookCard } from '#/components/cards/BookCard'
import { DonationCtaBanner } from '#/components/layout/DonationCtaBanner'
import { ResponsiveCardGrid } from '#/components/ui/responsive-card-grid'
import { Container } from '#/components/ui/container'
import { ShareButtons } from '#/components/books/ShareButtons'
import { BookComments } from '#/components/books/BookComments'
import { BOOK_VIEWS_VISIBLE_FROM, recordBookView } from '#/lib/cms/bookEngagement'

export function BookDetailPage({ book, related }: { book: BookDetail; related: Book[] }) {
  const [viewCount, setViewCount] = useState(book.viewCount ?? 0)

  useEffect(() => {
    let cancelled = false
    void recordBookView(book.id).then((count) => {
      if (!cancelled && typeof count === 'number') setViewCount(count)
    })
    return () => {
      cancelled = true
    }
  }, [book.id])

  const showViews = viewCount >= BOOK_VIEWS_VISIBLE_FROM

  return (
    <>
      <article>
        <div className="w-full overflow-hidden">
          <img src={book.coverImageUrl} alt={book.title} className="block h-auto w-full" />
        </div>
        <section className="w-full bg-white py-12 md:py-16">
          <Container className="max-w-3xl">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <Link
                to="/books"
                className="type-label inline-flex h-8 items-center gap-2 text-dq-muted transition-colors hover:text-dq-gold"
              >
                <ArrowLeft className="h-4 w-4" />
                All books
              </Link>
              <Badge className="type-eyebrow h-8 items-center px-3 tracking-[0.28em] uppercase">{book.category}</Badge>
            </div>
            <h1 className="type-headline text-dq-black">{book.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-dq-muted">
              <span>
                {book.authorName} · {format(new Date(book.publishedAt), 'MMMM d, yyyy')}
                {book.readTime ? ` · ${book.readTime}` : ''}
              </span>
              {showViews ? (
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                  {viewCount.toLocaleString()} views
                </span>
              ) : null}
            </div>
            <ShareButtons title={book.title} className="mt-6" />
            <div
              className="prose-dq mt-10 max-w-none [&_p]:type-body [&_p]:text-dq-muted"
              dangerouslySetInnerHTML={{ __html: book.bodyHtml }}
            />
            <BookComments bookId={book.id} />
          </Container>
        </section>
      </article>
      {related.length > 0 ? (
        <section className="bg-dq-cream/40 py-16 md:py-24">
          <ResponsiveCardGrid
            items={related}
            getKey={(item) => item.id}
            renderItem={(item) => <BookCard book={item} />}
            carouselLabel="books"
            desktopColumns={4}
            xlDesktopColumns={5}
            desktopBatchSize={5}
            desktopExpandable={false}
            fullWidth
            gapClass="gap-6 xl:gap-8"
            header={<h2 className="type-title text-dq-black">More books</h2>}
          />
        </section>
      ) : null}
      <DonationCtaBanner />
    </>
  )
}
