import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { Container } from '#/components/ui/container'
import { Button } from '#/components/ui/button'
import { useGiftCart } from '#/contexts/GiftCartContext'
import { getDonationByReference } from '#/lib/commerce/getDonation'
import type { GiftCartItem } from '#/lib/commerce/types'

export function CheckoutCancelPage({ reference }: { reference?: string }) {
  const { restoreCart, cart } = useGiftCart()

  useEffect(() => {
    if (!reference || cart.items.length > 0) return
    void getDonationByReference({ data: { reference } }).then((donation) => {
      if (donation?.items?.length && donation.paymentStatus === 'pending') {
        restoreCart(donation.items as GiftCartItem[])
      }
    })
  }, [reference, cart.items.length, restoreCart])

  return (
    <section className="py-20 md:py-28">
      <Container className="max-w-xl text-center">
        <h1 className="type-headline text-dq-black">Payment cancelled</h1>
        <p className="type-body mt-4 text-dq-muted">
          Your gift was not completed. Your selections have been restored — you can try again when ready.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="gold">
            <Link to="/donate/checkout">RETURN TO CHECKOUT</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/donate/cart">VIEW YOUR GIFT</Link>
          </Button>
        </div>
      </Container>
    </section>
  )
}
