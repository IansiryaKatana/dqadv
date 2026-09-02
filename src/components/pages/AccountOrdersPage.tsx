import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { PageHero } from '#/components/layout/PageHero'
import { Container } from '#/components/ui/container'
import { Button } from '#/components/ui/button'
import { useDonorAuth } from '#/contexts/DonorAuthContext'
import { getDonorDonations } from '#/lib/commerce/getDonation'
import { cancelDonorSubscription, listDonorSubscriptions } from '#/lib/donor/donorAccountApi'
import { formatPrice } from '#/lib/utils'

type OrderRow = {
  reference: string
  donorName: string
  total: number
  currency: string
  paymentStatus: string
  paymentProvider: string | null
  createdAt: string
  orderKind?: string
  frequency?: string
}

type SubRow = {
  id: string
  provider: string
  status: string
  amount: number
  currency: string
  created_at: string
  cancelled_at: string | null
}

export function AccountOrdersPage() {
  const { session, signOut, loading: authLoading } = useDonorAuth()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [subs, setSubs] = useState<SubRow[]>([])
  const [loading, setLoading] = useState(true)
  const [subBusy, setSubBusy] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.access_token) {
      setLoading(false)
      return
    }
    void Promise.all([
      getDonorDonations({ data: { accessToken: session.access_token } }),
      listDonorSubscriptions({ data: { accessToken: session.access_token } }),
    ]).then(([rows, subscriptions]) => {
      setOrders(rows)
      setSubs((subscriptions ?? []) as SubRow[])
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

          {subs.some((sub) => sub.status === 'active') ? (
            <div className="mb-8 space-y-3">
              <h2 className="type-title text-dq-black">Monthly gifts</h2>
              {subs
                .filter((sub) => sub.status === 'active')
                .map((sub) => (
                  <div
                    key={sub.id}
                    className="flex flex-col gap-3 rounded-2xl border border-dq-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-dq-black">
                        {formatPrice(Number(sub.amount), sub.currency)} / month
                      </p>
                      <p className="text-xs text-dq-muted">
                        {sub.provider} · {sub.status}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={subBusy === sub.id}
                      onClick={() => {
                        if (!session.access_token) return
                        setSubBusy(sub.id)
                        void cancelDonorSubscription({
                          data: { accessToken: session.access_token, subscriptionId: sub.id },
                        })
                          .then(() =>
                            listDonorSubscriptions({ data: { accessToken: session.access_token } }).then((next) =>
                              setSubs((next ?? []) as SubRow[]),
                            ),
                          )
                          .finally(() => setSubBusy(null))
                      }}
                    >
                      {subBusy === sub.id ? 'CANCELLING…' : 'CANCEL MONTHLY GIFT'}
                    </Button>
                  </div>
                ))}
            </div>
          ) : null}

          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dq-border bg-dq-cream/30 px-6 py-16 text-center">
              <p className="type-body text-dq-muted">No gifts yet.</p>
              <Button asChild variant="gold" className="mt-4">
                <Link to="/donate">GIVE NOW</Link>
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
                      {format(new Date(order.createdAt), 'MMM d, yyyy')} ·{' '}
                      {order.orderKind === 'quran_order' ? 'Qur’an order' : order.frequency === 'monthly' ? 'Monthly' : 'Gift'}{' '}
                      · {order.paymentStatus}
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
