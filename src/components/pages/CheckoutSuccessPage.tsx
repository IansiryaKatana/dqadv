import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Container } from '#/components/ui/container'
import { Button } from '#/components/ui/button'
import { useDonorAuth } from '#/contexts/DonorAuthContext'
import { getDonationByReference, type DonationPublic } from '#/lib/commerce/getDonation'
import { formatPrice } from '#/lib/utils'

export function CheckoutSuccessPage({ reference }: { reference?: string }) {
  const { user } = useDonorAuth()
  const [donation, setDonation] = useState<DonationPublic | null>(null)
  const [loading, setLoading] = useState(Boolean(reference))
  const [wantsAccount, setWantsAccount] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('dq-create-account') === '1') {
      setWantsAccount(true)
    }
  }, [])

  useEffect(() => {
    if (!reference) return
    let cancelled = false
    let attempts = 0

    async function load() {
      const result = await getDonationByReference({ data: { reference: reference! } })
      if (cancelled) return
      setDonation(result)
      setLoading(false)
      if (result?.paymentStatus === 'paid' && typeof window !== 'undefined') {
        sessionStorage.removeItem('dq-create-account')
        return
      }
      if (result?.paymentStatus === 'pending' && attempts < 4) {
        attempts += 1
        window.setTimeout(() => {
          if (!cancelled) void load()
        }, 2000)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [reference])

  const showRegisterCta = !user && (donation?.paymentStatus === 'paid' || wantsAccount)
  const isPaid = donation?.paymentStatus === 'paid'
  const isPending = donation?.paymentStatus === 'pending'
  const isOrder = donation?.orderKind === 'quran_order'

  return (
    <section className="bg-dq-cream/40 py-20 md:py-28">
      <Container className="max-w-xl text-center">
        {loading ? (
          <p className="type-body text-dq-muted">Confirming your payment...</p>
        ) : (
          <>
            <p className="type-eyebrow mb-3 text-dq-gold">JazakAllah khair</p>
            <h1 className="type-headline text-dq-black">
              {isPaid ? (
                isOrder ? (
                  <>
                    Order <span className="text-dq-gold">confirmed</span>
                  </>
                ) : (
                  <>
                    Gift <span className="text-dq-gold">received</span>
                  </>
                )
              ) : isPending ? (
                <>
                  Payment <span className="text-dq-gold">processing</span>
                </>
              ) : (
                <>
                  Thank you for <span className="text-dq-gold">giving</span>
                </>
              )}
            </h1>
            <p className="type-body mt-4 text-dq-muted">
              {isPaid
                ? isOrder
                  ? 'We will pack your Qur’ans for UK delivery and email you when they ship.'
                  : 'Thank you for your generous donation. A confirmation email has been sent to you.'
                : isPending
                  ? 'Your payment is being confirmed. You will receive an email once it is complete.'
                  : 'Thank you. Your support helps place the Qur’an in the hands of those seeking guidance.'}
            </p>
            {reference ? (
              <p className="mt-4 text-sm text-dq-muted">
                Reference: <span className="font-mono text-dq-black">{reference}</span>
              </p>
            ) : null}
            {donation && isPaid ? (
              <p className="mt-2 text-sm font-medium text-dq-black">
                {formatPrice(donation.total, donation.currency)}
                {donation.frequency === 'monthly' ? ' / month' : ''}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {showRegisterCta ? (
                <Button asChild variant="gold">
                  <Link to="/account/register" search={{ email: donation?.donorEmail, reference }}>
                    SAVE YOUR GIFT HISTORY
                  </Link>
                </Button>
              ) : user ? (
                <Button asChild variant="gold">
                  <Link to="/account/orders">VIEW MY GIFTS</Link>
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link to="/donate">GIVE AGAIN</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/">GO HOME</Link>
              </Button>
            </div>
          </>
        )}
      </Container>
    </section>
  )
}
