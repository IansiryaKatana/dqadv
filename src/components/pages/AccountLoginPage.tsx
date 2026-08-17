import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { PageHero } from '#/components/layout/PageHero'
import { Container } from '#/components/ui/container'
import { Button } from '#/components/ui/button'
import { PasswordInput } from '#/components/ui/PasswordInput'
import { useDonorAuth } from '#/contexts/DonorAuthContext'

export function AccountLoginPage() {
  const { signIn, configured } = useDonorAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputClass =
    'w-full rounded-xl border border-dq-border px-4 py-3 text-dq-black outline-none focus:border-dq-gold'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const result = await signIn(email, password)
    setBusy(false)
    if (result.error) setError(result.error)
    else void navigate({ to: '/account/orders' })
  }

  if (!configured) {
    return (
      <Container className="py-20 text-center">
        <p className="type-body text-dq-muted">Account sign-in is temporarily unavailable.</p>
      </Container>
    )
  }

  return (
    <>
      <PageHero
        eyebrow="Your account"
        title="Sign"
        highlight="in"
        description="View your gift history and track the impact of your donations."
        variant="cream"
      />
      <section className="pt-10 pb-16 md:pb-24">
        <Container className="max-w-md">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-2xl border border-dq-border bg-white p-6">
            <div>
              <label className="type-label mb-2 block" htmlFor="email">Email</label>
              <input id="email" type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="type-label block" htmlFor="password">Password</label>
                <Link to="/account/forgot-password" className="text-xs text-dq-gold hover:underline">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                required
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" variant="gold" className="w-full" disabled={busy}>
              {busy ? 'PLEASE WAIT...' : 'SIGN IN'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-dq-muted">
            New here?{' '}
            <Link to="/account/register" className="text-dq-gold hover:underline">
              Create an account
            </Link>
          </p>
        </Container>
      </section>
    </>
  )
}
