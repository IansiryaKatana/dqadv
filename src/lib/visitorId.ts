const VISITOR_KEY = 'dq_visitor_id'

export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'ssr'
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY)
    if (existing && existing.length >= 8) return existing
    const id = crypto.randomUUID()
    window.localStorage.setItem(VISITOR_KEY, id)
    return id
  } catch {
    return `anon-${Date.now()}`
  }
}
