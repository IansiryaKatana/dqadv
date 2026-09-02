import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { Container } from '#/components/ui/container'
import { Button } from '#/components/ui/button'
import { useDonorAuth } from '#/contexts/DonorAuthContext'
import { getDonationByReference, type DonationPublic } from '#/lib/commerce/getDonation'
import { formatPrice } from '#/lib/utils'

export function AccountOrderDetailPage({ reference }: { reference: string }) {
  const { session } = useDonorAuth()
  const [donation, setDonation] = useState<DonationPublic | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void getDonationByReference({ data: { reference } }).then((result) => {
      setDonation(result)
      setLoading(false)
    })
  }, [reference])

  if (loading) {
    return (
      <Container className="py-20 text-center">
        <p className="type-body text-dq-muted">Loading gift details...</p>
      </Container>
    )
  }

  if (!donation) {
    return (
      <Container className="py-20 text-center">
        <p className="type-body text-dq-muted">Gift not found.</p>
        <Button asChild variant="gold" className="mt-4">
          <Link to="/account/orders">BACK TO MY GIFTS</Link>
        </Button>
      </Container>
    )
  }

  if (session && donation.donorEmail.toLowerCase() !== session.user.email?.toLowerCase()) {
    return (
      <Container className="py-20 text-center">
        <p className="type-body text-dq-muted">You do not have access to this gift.</p>
      </Container>
    )
  }

  return (
    <section className="py-10 md:py-16">
      <Container className="max-w-2xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="type-eyebrow mb-2 text-dq-muted">Gift details</p>
            <h1 className="type-headline text-dq-black">{donation.reference}</h1>
            <p className="mt-2 text-sm text-dq-muted">
              {format(new Date(donation.createdAt), 'MMMM d, yyyy')} · {donation.paymentStatus}
            </p>
          </div>
          <Link
            to="/account/orders"
            className="type-label inline-flex shrink-0 items-center gap-2 text-dq-muted hover:text-dq-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        <div className="rounded-2xl border-2 border-dq-gold/60 bg-white p-6">
          <div className="mb-4 flex justify-between border-b border-dq-border pb-4">
            <span className="type-label text-dq-muted">Total</span>
            <span className="type-title">{formatPrice(donation.total, donation.currency)}</span>
          </div>
          {donation.dedication ? (
            <p className="mb-4 text-sm italic text-dq-muted">{donation.dedication}</p>
          ) : null}
          {donation.snapshot?.type === 'quran_order' ? (
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between">
                <span>{donation.snapshot.label}</span>
                <span>{formatPrice(donation.snapshot.cost, donation.currency)}</span>
              </li>
              <li className="flex justify-between">
                <span>Postage & packaging</span>
                <span>{formatPrice(donation.snapshot.postage, donation.currency)}</span>
              </li>
            </ul>
          ) : donation.snapshot?.type === 'donation' ? (
            <p className="text-sm text-dq-black">
              {donation.snapshot.frequency === 'monthly' ? 'Monthly gift' : 'Gift'} —{' '}
              {formatPrice(donation.snapshot.amount, donation.currency)}
            </p>
          ) : (
            <ul className="space-y-3">
              {donation.items.map((item) => (
                <li key={item.productId} className="flex justify-between gap-4 text-sm">
                  <span className="text-dq-black">
                    {item.title} × {item.quantity}
                  </span>
                  <span className="text-dq-muted">
                    {item.unitAmount != null
                      ? formatPrice(item.unitAmount * item.quantity, item.currency)
                      : 'Suggested gift'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  )
}
