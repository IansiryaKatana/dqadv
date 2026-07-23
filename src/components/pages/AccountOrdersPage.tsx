import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { PageHero } from '#/components/layout/PageHero'
import { Container } from '#/components/ui/container'
import { Button } from '#/components/ui/button'
import { useDonorAuth } from '#/contexts/DonorAuthContext'
import { getDonorDonations } from '#/lib/commerce/getDonation'
import { formatPrice } from '#/lib/utils'

type OrderRow = {
  reference: string
  donorName: string
  total: number
  currency: string
  paymentStatus: string
  paymentProvider: string | null
  createdAt: string
}

export function AccountOrdersPage() {
  const { session, signOut, loading: authLoading } = useDonorAuth()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.access_token) {
      setLoading(false)
      return
    }
    void getDonorDonations({ data: { accessToken: session.access_token } }).then((rows) => {
      setOrders(rows)
      setLoading(false)
    })
  }, [session])

  if (authLoading || loading) {
    return (
      <Container className="py-20 text-center">
        <p className="type-body text-dq-muted">Loading your gifts...</p>
      </Container>
    )
  }

  if (!session) {
    return (
      <Container className="py-20 text-center">
        <p className="type-body text-dq-muted mb-4">Sign in to view your gift history.</p>
        <Button asChild variant="gold">
          <Link to="/account/login">SIGN IN</Link>
        </Button>
      </Container>
    )
  }

  return (
    <>
      <PageHero
        eyebrow="Your account"
        title="My"
        highlight="gifts"
        description="A record of your generous donations and their impact."
        variant="cream"
      />
      <section className="pt-10 pb-16 md:pb-24">
        <Container>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-dq-muted">{session.user.email}</p>
            <Button variant="outline" size="sm" onClick={() => void signOut()}>
              SIGN OUT
            </Button>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dq-border bg-dq-cream/30 px-6 py-16 text-center">
              <p className="type-body text-dq-muted">No gifts yet.</p>
              <Button asChild variant="gold" className="mt-4">
                <Link to="/donate">BROWSE GIFTS</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.reference}
                  to="/account/orders/$reference"
                  params={{ reference: order.reference }}
                  className="flex flex-col gap-2 rounded-2xl border border-dq-border bg-white p-5 transition-colors hover:border-dq-gold/60 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-mono text-sm text-dq-black">{order.reference}</p>
                    <p className="text-xs text-dq-muted">
                      {format(new Date(order.createdAt), 'MMM d, yyyy')} · {order.paymentProvider ?? '—'} · {order.paymentStatus}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-dq-black">
                    {formatPrice(order.total, order.currency)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
