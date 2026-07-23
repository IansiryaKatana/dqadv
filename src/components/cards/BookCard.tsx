import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import type { Book } from '#/lib/cms/types'
import { Badge } from '#/components/ui/badge'

function truncateExcerpt(text: string, maxLength = 70) {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}…`
}

export function BookCard({ book }: { book: Book }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-lg">
      <Link to={`/books/${book.slug}`} className="block overflow-hidden">
        <div className="relative aspect-video w-full overflow-hidden bg-dq-cream/30">
          <img
            src={book.cardCoverImageUrl || book.coverImageUrl}
            alt={book.title}
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <Badge className="type-eyebrow self-start h-auto px-3 py-1.5 text-[10px] tracking-[0.28em] uppercase">
          {book.category}
        </Badge>
        <Link to={`/books/${book.slug}`}>
          <h3 className="text-[16px] font-semibold leading-snug text-dq-black transition-colors group-hover:text-dq-gold">
            {book.title}
          </h3>
        </Link>
        <p className="text-[12px] leading-relaxed text-dq-muted">{truncateExcerpt(book.excerpt)}</p>
        <p className="mt-auto text-[10px] leading-snug text-dq-muted">
          {book.authorName} · {format(new Date(book.publishedAt), 'MMM d, yyyy')}
          {book.readTime ? ` · ${book.readTime}` : ''}
        </p>
      </div>
    </article>
  )
}
