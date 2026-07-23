import type { BlogPost } from '#/lib/cms/types'
import { Container } from '#/components/ui/container'
import { SectionHeading } from '#/components/ui/section-heading'
import { SectionHeaderRow } from '#/components/ui/section-header-row'
import { BlogCard } from '#/components/cards/BlogCard'

export function BlogPreviewSection({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return null

  const visiblePosts = posts.slice(0, 2)

  return (
    <section className="bg-dq-cream/40 py-16 md:py-24">
      <Container>
        <SectionHeaderRow viewAllHref="/articles" layout="center">
          <SectionHeading eyebrow="Blog" title="Check latest" highlight="Blog Post" align="center" />
        </SectionHeaderRow>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {visiblePosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </Container>
    </section>
  )
}
