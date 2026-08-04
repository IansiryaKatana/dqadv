import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { PageHero } from '#/components/layout/PageHero'
import { Container } from '#/components/ui/container'
import { Button } from '#/components/ui/button'
import { PasswordInput } from '#/components/ui/PasswordInput'
import { useDonorAuth } from '#/contexts/DonorAuthContext'
import { getSupabase } from '#/integrations/supabase/client'

const inputClass =
  'w-full rounded-xl border border-dq-border px-4 py-3 text-dq-black outline-none focus:border-dq-gold focus:ring-2 focus:ring-dq-gold/20'

export function AccountResetPasswordPage() {
  const { updatePassword, configured } = useDonorAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

  async function handleSubmit(e: React.FormEvent) {
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

    void navigate({ to: '/account/orders' })
  }

  if (!configured) {
    return (
      <Container className="py-20 text-center">
        <p className="type-body text-dq-muted">Password reset is temporarily unavailable.</p>
      </Container>
    )
  }

  return (
    <>
      <PageHero
        eyebrow="Your account"
        title="Set new"
        highlight="password"
        description="Choose a new password for your account."
        variant="cream"
      />
      <section className="pb-16 pt-10 md:pb-24">
        <Container className="max-w-md">
          {checking ? (
            <p className="type-body text-center text-dq-muted">Verifying your reset link…</p>
          ) : !ready ? (
            <div className="space-y-4 rounded-2xl border border-dq-border bg-white p-6 text-center">
              <p className="type-body text-dq-black">This reset link is invalid or has expired.</p>
              <Link to="/account/forgot-password" className="type-label inline-block text-dq-gold hover:underline">
                Request a new reset link
              </Link>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-2xl border border-dq-border bg-white p-6">
              <div>
                <label className="type-label mb-2 block" htmlFor="new-password">
                  New password
                </label>
                <PasswordInput
                  id="new-password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="type-label mb-2 block" htmlFor="confirm-password">
                  Confirm password
                </label>
                <PasswordInput
                  id="confirm-password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={inputClass}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button type="submit" variant="gold" className="w-full" disabled={busy}>
                {busy ? 'PLEASE WAIT...' : 'UPDATE PASSWORD'}
              </Button>
            </form>
          )}
        </Container>
      </section>
    </>
  )
}
