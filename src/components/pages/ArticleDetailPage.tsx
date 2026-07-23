import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import type { BlogPost, BlogPostDetail } from '#/lib/cms/types'
import { Container } from '#/components/ui/container'
import { Badge } from '#/components/ui/badge'
import { BlogCard } from '#/components/cards/BlogCard'
import { DonationCtaBanner } from '#/components/layout/DonationCtaBanner'

type ArticleDetailPageProps = {
  post: BlogPostDetail
  related: BlogPost[]
}

export function ArticleDetailPage({ post, related }: ArticleDetailPageProps) {
  return (
    <>
      <article>
        <div className="relative h-64 overflow-hidden md:h-96">
          <img src={post.coverImageUrl} alt={post.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-dq-black/80 via-dq-black/30 to-transparent" />
        </div>

        <Container className="relative -mt-24 pb-12 md:-mt-32">
          <Link
            to="/articles"
            className="type-label mb-6 inline-flex items-center gap-2 text-white/80 transition-colors hover:text-dq-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            All articles
          </Link>

          <div className="max-w-3xl rounded-2xl bg-white p-6 shadow-lg md:p-10">
            <Badge className="type-eyebrow h-auto px-3 py-1.5 tracking-[0.28em] uppercase">{post.category}</Badge>
            <h1 className="type-headline mt-4 text-dq-black">{post.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-dq-muted">
              {post.authorAvatar ? (
                <img src={post.authorAvatar} alt={post.authorName} className="h-8 w-8 rounded-full object-cover" />
              ) : null}
              <span className="text-dq-black">{post.authorName}</span>
              <span>·</span>
              <time dateTime={post.publishedAt}>{format(new Date(post.publishedAt), 'MMMM d, yyyy')}</time>
              {post.readTime ? (
                <>
                  <span>·</span>
                  <span>{post.readTime}</span>
                </>
              ) : null}
            </div>
            <div
              className="prose-dq mt-8 max-w-none text-dq-muted [&_p]:type-body [&_p]:text-dq-muted [&_h2]:type-title [&_h2]:text-dq-black"
              dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
            />
          </div>
        </Container>
      </article>

      {related.length > 0 ? (
        <section className="bg-dq-cream/40 py-16 md:py-24">
          <Container>
            <h2 className="type-title mb-8 text-dq-black">More to read</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {related.map((item) => (
                <BlogCard key={item.id} post={item} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <DonationCtaBanner />
    </>
  )
}
