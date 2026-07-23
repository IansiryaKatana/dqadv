import staticCms from '#/data/static-cms.json'
import staticArticles from '#/data/static-articles.json'
import { getSupabase } from '#/integrations/supabase/client'
import type { BlogPost, BlogPostDetail } from './types'

function staticArticlesList(): BlogPost[] {
  return staticCms.blogPosts
}

function staticArticleDetail(slug: string): BlogPostDetail | null {
  const post = staticCms.blogPosts.find((p) => p.slug === slug)
  if (!post) return null
  const body = staticArticles[slug as keyof typeof staticArticles]
  return {
    ...post,
    bodyHtml: body?.bodyHtml ?? `<p>${post.excerpt}</p>`,
  }
}

export async function loadAllArticles(): Promise<BlogPost[]> {
  const sb = getSupabase()
  if (!sb) return staticArticlesList()

  try {
    const [articlesRes, authorsRes] = await Promise.all([
      sb.from('dq_articles').select('*').eq('status', 'published').order('published_at', { ascending: false }),
      sb.from('dq_authors').select('*'),
    ])

    if (articlesRes.error || !articlesRes.data?.length) return staticArticlesList()

    const authors = new Map((authorsRes.data ?? []).map((a) => [a.id, a]))

    return articlesRes.data.map((r) => {
      const author = r.author_id ? authors.get(r.author_id) : null
      return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        excerpt: r.excerpt,
        coverImageUrl: r.cover_image_url,
        category: r.category,
        authorName: author?.name ?? 'Donate Quran Team',
        authorAvatar: author?.avatar_url,
        publishedAt: r.published_at ?? r.created_at ?? new Date().toISOString(),
        readTime: r.read_time,
      }
    })
  } catch {
    return staticArticlesList()
  }
}

export async function loadArticleBySlug(slug: string): Promise<BlogPostDetail | null> {
  const sb = getSupabase()
  if (!sb) return staticArticleDetail(slug)

  try {
    const { data, error } = await sb
      .from('dq_articles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()

    if (error || !data) return staticArticleDetail(slug)

    let authorName = 'Donate Quran Team'
    let authorAvatar: string | null = null
    if (data.author_id) {
      const { data: author } = await sb.from('dq_authors').select('*').eq('id', data.author_id).maybeSingle()
      if (author) {
        authorName = author.name
        authorAvatar = author.avatar_url
      }
    }

    return {
      id: data.id,
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt,
      coverImageUrl: data.cover_image_url,
      category: data.category,
      authorName,
      authorAvatar,
      publishedAt: data.published_at ?? data.created_at ?? new Date().toISOString(),
      readTime: data.read_time,
      bodyHtml: data.body_html ?? `<p>${data.excerpt}</p>`,
    }
  } catch {
    return staticArticleDetail(slug)
  }
}
