import { Link } from '@tanstack/react-router'
import type { DonationProduct } from '#/lib/cms/types'
import { useGiftCart } from '#/contexts/GiftCartContext'
import { isFreeRequestProduct, isPayableGiftProduct } from '#/lib/commerce/productFlags'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

type AddToGiftButtonProps = {
  product: DonationProduct
  quantity?: number
  variant?: 'gold' | 'black' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showViewLink?: boolean
}

export function AddToGiftButton({
  product,
  quantity = 1,
  variant = 'gold',
  size = 'sm',
  className,
  showViewLink = false,
}: AddToGiftButtonProps) {
  const { addItem } = useGiftCart()

  if (isFreeRequestProduct(product)) {
    return (
      <Button asChild variant={variant} size={size} className={cn('w-full', className)}>
        <Link to="/order-free-qurans" search={{ product: product.slug, qty: quantity }}>
          {product.ctaLabel || 'REQUEST FREE COPY'}
        </Link>
      </Button>
    )
  }

  if (!isPayableGiftProduct(product)) {
    return (
      <Button asChild variant="outline" size={size} className={cn('w-full', className)}>
        <Link to={product.ctaUrl || '/contact'}>{product.ctaLabel || 'LEARN MORE'}</Link>
      </Button>
    )
  }

  if (showViewLink) {
    return (
      <div className={cn('flex flex-col gap-2 sm:flex-row', className)}>
        <Button
          type="button"
          variant={variant}
          size={size}
          className="flex-1"
          onClick={() => addItem(product, quantity)}
        >
          ADD TO YOUR GIFT
        </Button>
        <Button asChild variant="outline" size={size} className="flex-1">
          <Link to={`/donate/${product.slug}`}>VIEW DETAILS</Link>
        </Button>
      </div>
    )
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn('w-full', className)}
      onClick={() => addItem(product, quantity)}
    >
      ADD TO YOUR GIFT
    </Button>
  )
}
