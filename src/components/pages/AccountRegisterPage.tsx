import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { PageHero } from '#/components/layout/PageHero'
import { Container } from '#/components/ui/container'
import { Button } from '#/components/ui/button'
import { useDonorAuth } from '#/contexts/DonorAuthContext'

type AccountRegisterPageProps = {
  initialEmail?: string
  reference?: string
}

export function AccountRegisterPage({ initialEmail, reference }: AccountRegisterPageProps) {
  const { signUp, configured } = useDonorAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState(initialEmail ?? '')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputClass =
    'w-full rounded-xl border border-dq-border px-4 py-3 text-dq-black outline-none focus:border-dq-gold focus:ring-2 focus:ring-dq-gold/20'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const result = await signUp(email, password, fullName)
    setBusy(false)

    if (result.error) {
      setError(result.error)
      return
    }

    void navigate({ to: reference ? '/account/orders/$reference' : '/account/orders', params: reference ? { reference } : undefined })
  }

  if (!configured) {
    return (
      <Container className="py-20 text-center">
        <p className="type-body text-dq-muted">Account registration is temporarily unavailable.</p>
      </Container>
    )
  }

  return (
    <>
      <PageHero
        eyebrow="Your account"
        title="Create"
        highlight="account"
        description="Save your gift history and access your donation receipts anytime."
        variant="cream"
      />
      <section className="pt-10 pb-16 md:pb-24">
        <Container className="max-w-md">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-2xl border border-dq-border bg-white p-6">
            <div>
              <label className="type-label mb-2 block" htmlFor="fullName">Full name</label>
              <input id="fullName" required className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="type-label mb-2 block" htmlFor="email">Email</label>
              <input id="email" type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="type-label mb-2 block" htmlFor="password">Password</label>
              <input id="password" type="password" required minLength={8} className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" variant="gold" className="w-full" disabled={busy}>
              {busy ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-dq-muted">
            Already have an account?{' '}
            <Link to="/account/login" className="text-dq-gold hover:underline">
              Sign in
            </Link>
          </p>
        </Container>
      </section>
    </>
  )
}
