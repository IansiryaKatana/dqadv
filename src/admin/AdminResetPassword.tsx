import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useAdminAuth } from '#/contexts/AdminAuthContext'
import { getSupabase } from '#/integrations/supabase/client'
import '#/admin/admin-theme.css'

export function AdminResetPassword() {
  const { configured, updatePassword } = useAdminAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) {
      setChecking(false)
      return
    }

    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true)
        setChecking(false)
      }
    })

    void sb.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true)
      }
      setChecking(false)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    const result = await updatePassword(password)
    setBusy(false)

    if (result.error) {
      setError(result.error)
      return
    }

    void navigate({ to: '/backend' })
  }

  return (
    <div className="admin-auth-page flex min-h-screen items-center justify-center p-4">
      <div className="admin-panel w-full max-w-md p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-dq-black">Set new password</h1>
          <Link to="/backend/login" className="text-sm text-dq-gold hover:underline">
            Back to sign in
          </Link>
        </div>

        {!configured ? (
          <p className="admin-muted text-sm">Configure Supabase environment variables to enable password reset.</p>
        ) : checking ? (
          <p className="admin-muted text-sm">Verifying your reset link…</p>
        ) : !ready ? (
          <div className="space-y-4 text-sm">
            <p className="text-dq-black">This reset link is invalid or has expired.</p>
            <Link to="/backend/forgot-password" className="inline-block text-dq-gold hover:underline">
              Request a new reset link
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <p className="admin-muted text-sm">Choose a new password for your admin account.</p>
            <label className="block space-y-2">
              <span className="admin-label">New password</span>
              <div className="relative">
                <input
                  className="admin-input pr-11"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
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
            <label className="block space-y-2">
              <span className="admin-label">Confirm password</span>
              <div className="relative">
                <input
                  className="admin-input pr-11"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dq-muted transition-colors hover:text-dq-black"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button type="submit" className="admin-btn-primary w-full" disabled={busy}>
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
