import type { DonationProduct } from '#/lib/cms/types'

/** Physical free request — fulfilled via /order-free-qurans, not the paid gift cart. */
export function isFreeRequestProduct(product: Pick<DonationProduct, 'isFree' | 'kind' | 'price' | 'requiresShipping' | 'ctaUrl'>): boolean {
  if (product.isFree || product.kind === 'free') return true
  if ((product.price ?? 0) > 0) return false
  return Boolean(product.requiresShipping) || (product.ctaUrl ?? '').includes('/order-free-qurans')
}

/** Paid sponsorship/gift that can go through checkout. */
export function isPayableGiftProduct(product: DonationProduct): boolean {
  return (product.price ?? 0) > 0 && !isFreeRequestProduct(product)
}
