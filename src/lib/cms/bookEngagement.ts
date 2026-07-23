import { getSupabase } from '#/integrations/supabase/client'
import { getVisitorId } from '#/lib/visitorId'

export const BOOK_VIEWS_VISIBLE_FROM = 100

export type BookComment = {
  id: string
  bookId: string
  authorName: string
  body: string
  createdAt: string
}

type CommentRow = {
  id: string
  book_id: string
  author_name: string
  body: string
  created_at: string
}

function mapComment(row: CommentRow): BookComment {
  return {
    id: row.id,
    bookId: row.book_id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  }
}

export async function recordBookView(bookId: string): Promise<number | null> {
  const sb = getSupabase()
  if (!sb) return null
  try {
    const { data, error } = await (sb as unknown as {
      rpc: (
        fn: string,
        args: { p_book_id: string; p_visitor_id: string },
      ) => Promise<{ data: number | null; error: { message: string } | null }>
    }).rpc('dq_record_book_view', {
      p_book_id: bookId,
      p_visitor_id: getVisitorId(),
    })
    if (error) return null
    return typeof data === 'number' ? data : Number(data)
  } catch {
    return null
  }
}

export async function loadBookComments(bookId: string): Promise<BookComment[]> {
  const sb = getSupabase()
  if (!sb) return []
  try {
    const client = sb as unknown as {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (col: string, value: string) => {
            eq: (col: string, value: string) => {
              order: (
                col: string,
                opts: { ascending: boolean },
              ) => Promise<{ data: CommentRow[] | null; error: { message: string } | null }>
            }
          }
        }
      }
    }

    const { data, error } = await client
      .from('dq_book_comments')
      .select('id, book_id, author_name, body, created_at')
      .eq('book_id', bookId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data.map(mapComment)
  } catch {
    return []
  }
}

export async function submitBookComment(input: {
  bookId: string
  authorName: string
  body: string
}): Promise<{ ok: true; comment: BookComment } | { ok: false; error: string }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, error: 'Comments are unavailable right now.' }

  const authorName = input.authorName.trim()
  const body = input.body.trim()
  if (authorName.length < 1 || authorName.length > 80) {
    return { ok: false, error: 'Please enter a name (up to 80 characters).' }
  }
  if (body.length < 1 || body.length > 2000) {
    return { ok: false, error: 'Please enter a comment (up to 2000 characters).' }
  }

  try {
    const client = sb as unknown as {
      from: (table: string) => {
        insert: (row: Record<string, unknown>) => {
          select: (cols: string) => {
            single: () => Promise<{ data: CommentRow | null; error: { message: string } | null }>
          }
        }
      }
    }

    const { data, error } = await client
      .from('dq_book_comments')
      .insert({
        book_id: input.bookId,
        author_name: authorName,
        body,
        status: 'approved',
      })
      .select('id, book_id, author_name, body, created_at')
      .single()

    if (error || !data) {
      return { ok: false, error: error?.message ?? 'Could not post comment.' }
    }

    return { ok: true, comment: mapComment(data) }
  } catch {
    return { ok: false, error: 'Could not post comment.' }
  }
}
