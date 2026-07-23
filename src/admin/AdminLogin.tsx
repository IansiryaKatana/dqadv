import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useAdminAuth } from '#/contexts/AdminAuthContext'
import '#/admin/admin-theme.css'

export function AdminLogin() {
  const { configured, loading, session, signIn } = useAdminAuth()
  const navigate = useNavigate()
  const search = useSearch({ from: '/backend/login' }) as { redirect?: string }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && session) {
    void navigate({ to: search.redirect ?? '/backend' })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = await signIn(email.trim(), password)
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    void navigate({ to: search.redirect ?? '/backend' })
  }

  return (
    <div className="admin-auth-page flex min-h-screen items-center justify-center p-4">
      <div className="admin-panel w-full max-w-md p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-dq-black">Donate Quran Admin</h1>
          <Link to="/" className="text-sm text-dq-gold hover:underline">
            Back to site
          </Link>
        </div>
        {!configured ? (
          <p className="admin-muted text-sm">Configure Supabase environment variables to enable admin login.</p>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <label className="block space-y-2">
              <span className="admin-label">Email</span>
              <input className="admin-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block space-y-2">
              <span className="admin-label">Password</span>
              <div className="relative">
                <input
                  className="admin-input pr-11"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dq-muted transition-colors hover:text-dq-black"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            <p className="text-right">
              <Link to="/backend/forgot-password" className="text-sm text-dq-gold hover:underline">
                Forgot password?
              </Link>
            </p>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button type="submit" className="admin-btn-primary w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
            <p className="admin-muted text-center text-sm">
              Need an admin account?{' '}
              <Link to="/backend/signup" className="text-dq-gold hover:underline">
                Create one
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
