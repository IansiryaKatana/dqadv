import { createServerFn } from '@tanstack/react-start'
import staticBooks from '#/data/static-books.json'
import { getSupabase } from '#/integrations/supabase/client'
import type { Book, BookDetail } from './types'

function staticBookDetail(slug: string): BookDetail | null {
  const book = staticBooks.find((b) => b.slug === slug)
  if (!book) return null
  return book as BookDetail
}

async function fetchAllBooks(): Promise<Book[]> {
  const sb = getSupabase()
  if (!sb) return staticBooks as unknown as Book[]

  try {
    const [booksRes, authorsRes] = await Promise.all([
      sb.from('dq_books').select('*').eq('status', 'published').order('sort_order'),
      sb.from('dq_authors').select('*'),
    ])

    if (booksRes.error || !booksRes.data?.length) return staticBooks as unknown as Book[]

    const authors = new Map((authorsRes.data ?? []).map((a) => [a.id, a]))

    return booksRes.data.map((r) => {
      const author = r.author_id ? authors.get(r.author_id) : null
      return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        excerpt: r.excerpt,
        coverImageUrl: r.cover_image_url,
        cardCoverImageUrl: r.card_cover_image_url || null,
        category: r.category,
        authorName: author?.name ?? 'Donate Quran Team',
        authorAvatar: author?.avatar_url,
        publishedAt: r.published_at ?? r.created_at ?? new Date().toISOString(),
        readTime: r.read_time,
        sortOrder: r.sort_order,
        viewCount: typeof r.view_count === 'number' ? r.view_count : 0,
      }
    })
  } catch {
    return staticBooks as unknown as Book[]
  }
}

async function fetchBookBySlug(slug: string): Promise<BookDetail | null> {
  const sb = getSupabase()
  if (!sb) return staticBookDetail(slug)

  try {
    const { data, error } = await sb
      .from('dq_books')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()

    if (error || !data) return staticBookDetail(slug)

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
      cardCoverImageUrl: data.card_cover_image_url || null,
      category: data.category,
      authorName,
      authorAvatar,
      publishedAt: data.published_at ?? data.created_at ?? new Date().toISOString(),
      readTime: data.read_time,
      sortOrder: data.sort_order,
      viewCount: typeof data.view_count === 'number' ? data.view_count : 0,
      bodyHtml: data.body_html ?? `<p>${data.excerpt}</p>`,
    }
  } catch {
    return staticBookDetail(slug)
  }
}

/** Always runs on the server so Cloudflare request env is available on first paint. */
export const loadAllBooks = createServerFn({ method: 'POST', strict: false }).handler(async () => {
  return await fetchAllBooks()
})

export const loadBookBySlug = createServerFn({ method: 'POST', strict: false })
  .validator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    return await fetchBookBySlug(data.slug)
  })
