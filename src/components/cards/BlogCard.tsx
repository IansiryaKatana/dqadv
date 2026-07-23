import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import type { BlogPost } from '#/lib/cms/types'
import { Badge } from '#/components/ui/badge'

function truncateExcerpt(text: string, maxLength = 64) {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}…`
}

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-lg">
      <Link to={`/articles/${post.slug}`} className="block overflow-hidden">
        <div className="relative aspect-video w-full overflow-hidden bg-dq-cream/30">
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>
      <div className="space-y-3 p-6">
        <Badge className="type-eyebrow h-auto px-3 py-1.5 text-[10px] tracking-[0.28em] uppercase">{post.category}</Badge>
        <Link to={`/articles/${post.slug}`}>
          <h3 className="type-title text-dq-black transition-colors group-hover:text-dq-gold">{post.title}</h3>
        </Link>
        <p className="type-body text-dq-muted">{truncateExcerpt(post.excerpt)}</p>
        <div className="flex items-center gap-3 pt-2 text-xs text-dq-muted">
          {post.authorAvatar ? <img src={post.authorAvatar} alt={post.authorName} className="h-8 w-8 rounded-full object-cover" /> : null}
          <div>
            <p className="font-light text-dq-black">{post.authorName}</p>
            <p>
              {format(new Date(post.publishedAt), 'MMM d, yyyy')}
              {post.readTime ? ` · ${post.readTime}` : ''}
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}
