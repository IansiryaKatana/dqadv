import type { GiftCart } from './types'

const STORAGE_KEY = 'dq-gift-cart'

export function emptyCart(): GiftCart {
  return { items: [], updatedAt: new Date().toISOString() }
}

export function readCart(): GiftCart {
  if (typeof window === 'undefined') return emptyCart()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyCart()
    const parsed = JSON.parse(raw) as GiftCart
    if (!Array.isArray(parsed.items)) return emptyCart()
    return parsed
  } catch {
    return emptyCart()
  }
}

export function writeCart(cart: GiftCart): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cart, updatedAt: new Date().toISOString() }))
}
