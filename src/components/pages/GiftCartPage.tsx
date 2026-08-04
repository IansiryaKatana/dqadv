import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useGiftCart } from '#/contexts/GiftCartContext'
import { GiftLineItem } from '#/components/commerce/GiftLineItem'
import { PageHero } from '#/components/layout/PageHero'
import { Container } from '#/components/ui/container'
import { Button } from '#/components/ui/button'
import { formatPrice } from '#/lib/utils'
import type { TrustBlock } from '#/lib/cms/types'
import { PostageFootnote } from '#/components/commerce/PostageFootnote'

type GiftCartPageProps = {
  postageNote?: TrustBlock
}

export function GiftCartPage({ postageNote }: GiftCartPageProps) {
  const { cart, subtotal, itemCount } = useGiftCart()
  const currency = cart.items[0]?.currency ?? 'GBP'
  const needsShipping = cart.items.some((i) => i.requiresShipping)

  return (
    <>
      <PageHero
        eyebrow="Your cart"
        title="Review your"
        highlight="Donation"
        description="Review your selections below. When you're ready, continue to checkout to complete your donation."
        variant="cream"
      />

      <section className="pt-10 md:pt-12 pb-16 md:pb-24">
        <Container>
          <Link
            to="/donate"
            className="type-label mb-8 inline-flex items-center gap-2 text-dq-muted transition-colors hover:text-dq-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue giving
          </Link>

          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center gap-6 rounded-2xl border border-dq-border bg-dq-cream/30 px-6 py-16 text-center">
              <p className="type-body text-dq-muted">Your cart is empty.</p>
              <Button asChild variant="gold">
                <Link to="/donate">BROWSE DONATIONS</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
              <div className="rounded-2xl border border-dq-border bg-white p-5 md:p-6">
                {cart.items.map((item) => (
                  <GiftLineItem key={item.productId} item={item} />
                ))}
              </div>

              <aside className="h-fit rounded-2xl border-2 border-dq-gold/60 bg-white p-6 shadow-sm">
                <h2 className="type-title mb-6 text-dq-black">Order summary</h2>
                <div className="space-y-3 border-b border-dq-border pb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-dq-muted">Items</span>
                    <span className="text-dq-black">{itemCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="type-label text-dq-muted">Total</span>
                    <span className="type-title text-dq-black">
                      {subtotal > 0 ? formatPrice(subtotal, currency) : 'Custom amount'}
                    </span>
                  </div>
                </div>
                {needsShipping ? <PostageFootnote block={postageNote} className="mb-4" /> : null}
                <Button asChild variant="gold" className="mt-6 w-full">
                  <Link to="/donate/checkout">CONTINUE TO CHECKOUT</Link>
                </Button>
                <Button asChild variant="ghost" className="mt-2 w-full">
                  <Link to="/donate">Add more</Link>
                </Button>
              </aside>
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
