import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { PageHero } from '#/components/layout/PageHero'
import { Container } from '#/components/ui/container'
import { Button } from '#/components/ui/button'
import { useDonorAuth } from '#/contexts/DonorAuthContext'

const inputClass =
  'w-full rounded-xl border border-dq-border px-4 py-3 text-dq-black outline-none focus:border-dq-gold focus:ring-2 focus:ring-dq-gold/20'

export function AccountForgotPasswordPage() {
  const { requestPasswordReset, configured } = useDonorAuth()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
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
        title="Reset"
        highlight="password"
        description="Enter your email and we will send you a link to choose a new password."
        variant="cream"
      />
      <section className="pb-16 pt-10 md:pb-24">
        <Container className="max-w-md">
          {sent ? (
            <div className="space-y-4 rounded-2xl border border-dq-border bg-white p-6 text-center">
              <p className="type-body text-dq-black">
                If an account exists for <strong>{email}</strong>, you will receive a password reset email shortly.
              </p>
              <p className="type-body text-sm text-dq-muted">
                Open the link in that email to set a new password. The link expires after a short time.
              </p>
              <Link to="/account/login" className="type-label inline-block text-dq-gold hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-2xl border border-dq-border bg-white p-6">
              <div>
                <label className="type-label mb-2 block" htmlFor="reset-email">
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button type="submit" variant="gold" className="w-full" disabled={busy}>
                {busy ? 'PLEASE WAIT...' : 'SEND RESET LINK'}
              </Button>
            </form>
          )}
          {!sent ? (
            <p className="mt-6 text-center text-sm text-dq-muted">
              Remembered it?{' '}
              <Link to="/account/login" className="text-dq-gold hover:underline">
                Sign in
              </Link>
            </p>
          ) : null}
        </Container>
      </section>
    </>
  )
}
