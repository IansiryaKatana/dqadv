import type { DonationProduct } from '#/lib/cms/types'

export type GiftCartItem = {
  productId: string
  slug: string
  title: string
  imageUrl: string
  unitAmount: number | null
  currency: string
  quantity: number
  requiresShipping: boolean
  impactStatement?: string | null
}

export type GiftCart = {
  items: GiftCartItem[]
  updatedAt: string
}

export function productToCartItem(product: DonationProduct, quantity = 1): GiftCartItem {
  return {
    productId: product.id,
    slug: product.slug,
    title: product.title,
    imageUrl: product.imageUrl,
    unitAmount: product.price ?? null,
    currency: product.currency ?? 'GBP',
    quantity,
    requiresShipping: product.requiresShipping ?? false,
    impactStatement: product.impactStatement ?? null,
  }
}

export function cartItemCount(cart: GiftCart): number {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0)
}

export function cartSubtotal(cart: GiftCart): number {
  return cart.items.reduce((sum, item) => sum + (item.unitAmount ?? 0) * item.quantity, 0)
}
