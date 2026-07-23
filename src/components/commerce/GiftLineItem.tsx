import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { GiftCartItem } from '#/lib/commerce/types'
import { useGiftCart } from '#/contexts/GiftCartContext'
import { formatPrice } from '#/lib/utils'
import { Button } from '#/components/ui/button'

export function GiftLineItem({ item }: { item: GiftCartItem }) {
  const { updateQuantity, removeItem } = useGiftCart()
  const lineTotal = item.unitAmount != null ? item.unitAmount * item.quantity : null

  return (
    <div className="flex gap-4 border-b border-dq-border/60 py-4 last:border-b-0">
      <Link to={`/donate/${item.slug}`} className="shrink-0 overflow-hidden rounded-xl">
        <img src={item.imageUrl} alt={item.title} className="h-20 w-20 object-cover" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/donate/${item.slug}`}
            className="text-sm font-medium leading-snug text-dq-black hover:text-dq-gold"
          >
            {item.title}
          </Link>
          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            className="shrink-0 rounded-full p-1 text-dq-muted transition-colors hover:bg-dq-cream hover:text-dq-black"
            aria-label={`Remove ${item.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        {item.impactStatement ? (
          <p className="text-xs text-dq-muted">{item.impactStatement}</p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="type-label min-w-[2ch] text-center">{item.quantity}</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <p className="type-body text-dq-black">
            {lineTotal != null
              ? formatPrice(lineTotal, item.currency)
              : 'Suggested gift'}
          </p>
        </div>
      </div>
    </div>
  )
}
