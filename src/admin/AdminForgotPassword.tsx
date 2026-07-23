import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { useAdminAuth } from '#/contexts/AdminAuthContext'
import '#/admin/admin-theme.css'

export function AdminForgotPassword() {
  const { configured, requestPasswordReset } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const result = await requestPasswordReset(email)
    setBusy(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSent(true)
  }

  return (
    <div className="admin-auth-page flex min-h-screen items-center justify-center p-4">
      <div className="admin-panel w-full max-w-md p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-dq-black">Reset admin password</h1>
          <Link to="/backend/login" className="text-sm text-dq-gold hover:underline">
            Back to sign in
          </Link>
        </div>

        {!configured ? (
          <p className="admin-muted text-sm">Configure Supabase environment variables to enable password reset.</p>
        ) : sent ? (
          <div className="space-y-4 text-sm">
            <p className="text-dq-black">
              If an admin account exists for <strong>{email}</strong>, you will receive a password reset email shortly.
            </p>
            <p className="admin-muted">
              Open the link in that email to set a new password. The link expires after a short time.
            </p>
            <Link to="/backend/login" className="inline-block text-dq-gold hover:underline">
              Return to sign in
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <p className="admin-muted text-sm">
              Enter your admin email and we will send you a link to choose a new password.
            </p>
            <label className="block space-y-2">
              <span className="admin-label">Email</span>
              <input
                className="admin-input"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button type="submit" className="admin-btn-primary w-full" disabled={busy}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
