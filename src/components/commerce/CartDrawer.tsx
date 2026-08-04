import * as Dialog from '@radix-ui/react-dialog'
import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useGiftCart } from '#/contexts/GiftCartContext'
import { GiftLineItem } from '#/components/commerce/GiftLineItem'
import { Button } from '#/components/ui/button'
import { formatPrice } from '#/lib/utils'

export function CartDrawer() {
  const { cart, drawerOpen, closeDrawer, subtotal, itemCount } = useGiftCart()
  const currency = cart.items[0]?.currency ?? 'GBP'

  return (
    <Dialog.Root open={drawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content
          className="fixed z-[70] flex max-h-[92dvh] w-full flex-col bg-white shadow-2xl outline-none bottom-0 left-0 right-0 rounded-t-2xl mb-0 md:bottom-auto md:left-auto md:right-0 md:top-0 md:h-full md:max-h-none md:w-full md:max-w-md md:rounded-none"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between border-b border-dq-border px-5 py-4">
            <Dialog.Title className="type-title text-dq-black">Your cart</Dialog.Title>
            <Dialog.Close
              className="rounded-full p-2 text-dq-black transition-colors hover:bg-dq-cream"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5">
            {cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <p className="type-body text-dq-muted">Your cart is empty. Choose a donation to begin.</p>
                <Button asChild variant="gold" onClick={closeDrawer}>
                  <Link to="/donate">BROWSE DONATIONS</Link>
                </Button>
              </div>
            ) : (
              <div>
                {cart.items.map((item) => (
                  <GiftLineItem key={item.productId} item={item} />
                ))}
              </div>
            )}
          </div>

          {cart.items.length > 0 ? (
            <div className="border-t border-dq-border px-5 py-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="type-label text-dq-muted">Total</span>
                <span className="type-title text-dq-black">
                  {subtotal > 0 ? formatPrice(subtotal, currency) : 'Custom amount'}
                </span>
              </div>
              <p className="mb-4 text-xs text-dq-muted">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} · Continue to secure payment
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                  <Button asChild variant="gold" className="w-full" onClick={closeDrawer}>
                    <Link to="/donate/checkout">CONTINUE TO CHECKOUT</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full" onClick={closeDrawer}>
                    <Link to="/donate/cart">VIEW CART</Link>
                  </Button>
                </div>
                <Dialog.Close asChild>
                  <Button variant="ghost" className="w-full">
                    Continue browsing
                  </Button>
                </Dialog.Close>
              </div>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
