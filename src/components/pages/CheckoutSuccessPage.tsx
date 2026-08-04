import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Container } from '#/components/ui/container'
import { Button } from '#/components/ui/button'
import { useGiftCart } from '#/contexts/GiftCartContext'
import { useDonorAuth } from '#/contexts/DonorAuthContext'
import { getDonationByReference, type DonationPublic } from '#/lib/commerce/getDonation'
import { formatPrice } from '#/lib/utils'

export function CheckoutSuccessPage({ reference }: { reference?: string }) {
  const { clearCart } = useGiftCart()
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
    void getDonationByReference({ data: { reference } }).then((result) => {
      setDonation(result)
      setLoading(false)
      if (result?.paymentStatus === 'paid') {
        clearCart()
        if (typeof window !== 'undefined' && sessionStorage.getItem('dq-create-account') === '1') {
          sessionStorage.removeItem('dq-create-account')
        }
      }
    })
  }, [reference, clearCart])

  const showRegisterCta = !user && (donation?.paymentStatus === 'paid' || wantsAccount)

  const isPaid = donation?.paymentStatus === 'paid'
  const isPending = donation?.paymentStatus === 'pending'

  return (
    <section className="bg-dq-cream/40 py-20 md:py-28">
      <Container className="max-w-xl text-center">
        {loading ? (
          <p className="type-body text-dq-muted">Confirming your donation...</p>
        ) : (
          <>
            <p className="type-eyebrow mb-3 text-dq-gold">JazakAllah khair</p>
            <h1 className="type-headline text-dq-black">
              {isPaid ? (
                <>
                  Donation <span className="text-dq-gold">received</span>
                </>
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
                ? 'Thank you for your generous donation. A confirmation email has been sent to you.'
                : isPending
                  ? 'Your payment is being confirmed. You will receive an email once it is complete.'
                  : 'Thank you for your generous donation. Your support helps place the Qur\'an in the hands of those seeking guidance.'}
            </p>
            {reference ? (
              <p className="mt-4 text-sm text-dq-muted">
                Reference: <span className="font-mono text-dq-black">{reference}</span>
              </p>
            ) : null}
            {donation && isPaid ? (
              <p className="mt-2 text-sm font-medium text-dq-black">
                {formatPrice(donation.total, donation.currency)}
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
