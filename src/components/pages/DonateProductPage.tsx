import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import type { DonationProduct } from '#/lib/cms/types'
import { Container } from '#/components/ui/container'
import { Button } from '#/components/ui/button'
import { AddToGiftButton } from '#/components/commerce/AddToGiftButton'
import { DonationCard } from '#/components/cards/DonationCard'
import { DonationCtaBanner } from '#/components/layout/DonationCtaBanner'
import { formatPrice } from '#/lib/utils'

type DonateProductPageProps = {
  product: DonationProduct
  related: DonationProduct[]
}

export function DonateProductPage({ product, related }: DonateProductPageProps) {
  const [quantity, setQuantity] = useState(1)
  const price = formatPrice(product.price ?? null, product.currency ?? 'GBP')
  const maxQty = product.maxQuantity ?? 99

  return (
    <>
      <section className="bg-dq-cream/40 py-8 md:py-12">
        <Container>
          <Link
            to="/donate"
            className="type-label mb-8 inline-flex items-center gap-2 text-dq-muted transition-colors hover:text-dq-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all gifts
          </Link>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="overflow-hidden rounded-2xl border-2 border-dq-gold/60 bg-white shadow-sm lg:h-full">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="aspect-[4/3] h-full w-full object-cover lg:aspect-auto lg:min-h-full"
              />
            </div>

            <div className="flex flex-col gap-5">
              {product.category ? (
                <p className="type-eyebrow text-dq-muted">{product.category}</p>
              ) : null}
              <h1 className="type-headline text-dq-black">{product.title}</h1>
              <p className="type-body text-dq-muted">{product.description}</p>

              {product.impactStatement ? (
                <div className="rounded-xl border border-dq-gold/40 bg-dq-gold/10 px-4 py-3">
                  <p className="type-label text-dq-black">Your impact</p>
                  <p className="type-body mt-1 text-dq-muted">{product.impactStatement}</p>
                </div>
              ) : null}

              <div className="flex flex-wrap items-baseline gap-3">
                {price ? (
                  <p className="type-headline text-2xl text-dq-black">{price}</p>
                ) : (
                  <p className="type-title text-dq-black">Suggested gift</p>
                )}
                {product.stockStatus ? (
                  <p className="text-sm text-dq-muted">{product.stockStatus}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span className="type-label text-dq-muted">Quantity</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                    >
                      −
                    </Button>
                    <span className="type-label min-w-[2ch] text-center">{quantity}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      disabled={quantity >= maxQty}
                      onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                      aria-label="Increase quantity"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              <AddToGiftButton product={product} quantity={quantity} size="lg" className="max-w-sm" />

              <p className="text-xs text-dq-muted">
                Payment is processed as a donation. You receive the sponsored item or its equivalent impact.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {related.length > 0 ? (
        <section className="bg-white py-16 md:py-24">
          <Container>
            <h2 className="type-title mb-8 text-dq-black">Multiply your impact</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {related.map((item) => (
                <DonationCard key={item.id} product={item} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <DonationCtaBanner />
    </>
  )
}
