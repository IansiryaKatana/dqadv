import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Button } from '#/components/ui/button'
import { loadBookComments, submitBookComment, type BookComment } from '#/lib/cms/bookEngagement'

export function BookComments({ bookId }: { bookId: string }) {
  const [comments, setComments] = useState<BookComment[]>([])
  const [authorName, setAuthorName] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false
    void loadBookComments(bookId).then((rows) => {
      if (!cancelled) setComments(rows)
    })
    return () => {
      cancelled = true
    }
  }, [bookId])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setSuccess(false)
    const result = await submitBookComment({ bookId, authorName, body })
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setComments((prev) => [result.comment, ...prev])
    setBody('')
    setSuccess(true)
  }

  return (
    <section className="mt-14 border-t border-dq-border/60 pt-10">
      <h2 className="type-title text-dq-black">Comments</h2>
      <p className="type-body mt-2 text-dq-muted">Share a reflection or question about this book.</p>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 grid max-w-2xl gap-4">
        <label className="block space-y-2">
          <span className="type-label text-dq-muted">Name</span>
          <input
            className="w-full rounded-none border-2 border-dq-border bg-white px-4 py-3 type-body text-dq-black outline-none transition-colors focus:border-dq-gold focus-visible:outline-none"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            maxLength={80}
            required
            placeholder="Your name"
          />
        </label>
        <label className="block space-y-2">
          <span className="type-label text-dq-muted">Comment</span>
          <textarea
            className="min-h-28 w-full rounded-none border-2 border-dq-border bg-white px-4 py-3 type-body text-dq-black outline-none transition-colors focus:border-dq-gold focus-visible:outline-none"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            required
            placeholder="Write your comment…"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? <p className="text-sm text-dq-muted">Thank you — your comment was posted.</p> : null}
        <div>
          <Button type="submit" variant="gold" size="md" disabled={busy}>
            {busy ? 'Posting…' : 'Post comment'}
          </Button>
        </div>
      </form>

      <div className="mt-10 space-y-6">
        {comments.length === 0 ? (
          <p className="type-body text-dq-muted">No comments yet. Be the first to share.</p>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="border-b border-dq-border/40 pb-6 last:border-b-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="font-medium text-dq-black">{comment.authorName}</p>
                <time className="text-sm text-dq-muted" dateTime={comment.createdAt}>
                  {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                </time>
              </div>
              <p className="type-body mt-2 whitespace-pre-wrap text-dq-muted">{comment.body}</p>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
