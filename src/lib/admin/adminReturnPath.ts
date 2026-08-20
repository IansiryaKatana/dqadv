const RETURN_TO_KEY = 'dq-admin-return-to'

const AUTH_PATHS = new Set([
  '/backend/login',
  '/backend/signup',
  '/backend/forgot-password',
  '/backend/reset-password',
])

export function isSafeAdminReturnPath(path: string | undefined | null): path is string {
  if (!path || path.includes('://') || path.startsWith('//')) return false
  const pathname = path.split('?')[0]?.split('#')[0] ?? ''
  if (pathname !== '/backend' && !pathname.startsWith('/backend/')) return false
  if (AUTH_PATHS.has(pathname)) return false
  return true
}

export function resolveAdminReturnPath(path?: string | null) {
  return isSafeAdminReturnPath(path) ? path : '/backend'
}

export function peekAdminReturnPath() {
  if (typeof sessionStorage === 'undefined') return undefined
  const value = sessionStorage.getItem(RETURN_TO_KEY)
  return isSafeAdminReturnPath(value) ? value : undefined
}

export function stashAdminReturnPath(pathname: string) {
  if (typeof sessionStorage === 'undefined') return
  if (!isSafeAdminReturnPath(pathname)) return
  sessionStorage.setItem(RETURN_TO_KEY, pathname)
}

export function takeAdminReturnPath() {
  const value = peekAdminReturnPath()
  if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(RETURN_TO_KEY)
  return value
}
