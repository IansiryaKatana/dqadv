import { ShoppingBag } from 'lucide-react'
import { useGiftCart } from '#/contexts/GiftCartContext'
import { cn } from '#/lib/utils'

type GiftCartButtonProps = {
  className?: string
}

export function GiftCartButton({ className }: GiftCartButtonProps) {
  const { itemCount, openDrawer } = useGiftCart()

  return (
    <button
      type="button"
      onClick={openDrawer}
      className={cn(
        'relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dq-border text-dq-black transition-colors hover:border-dq-gold hover:text-dq-gold focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-dq-gold',
        className,
      )}
      aria-label={`Your cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
    >
      <ShoppingBag className="h-4 w-4" />
      {itemCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-dq-gold px-1 text-[10px] font-light text-dq-black">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      ) : null}
    </button>
  )
}
