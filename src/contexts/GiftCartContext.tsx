import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { DonationProduct } from '#/lib/cms/types'
import { emptyCart, readCart, writeCart } from '#/lib/commerce/cartStorage'
import {
  cartItemCount,
  cartSubtotal,
  productToCartItem,
  type GiftCart,
  type GiftCartItem,
} from '#/lib/commerce/types'

type GiftCartContextValue = {
  cart: GiftCart
  itemCount: number
  subtotal: number
  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  addItem: (product: DonationProduct, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  restoreCart: (items: GiftCartItem[]) => void
}

const GiftCartContext = createContext<GiftCartContextValue | null>(null)

function mergeItem(items: GiftCartItem[], incoming: GiftCartItem): GiftCartItem[] {
  const existing = items.find((item) => item.productId === incoming.productId)
  if (!existing) return [...items, incoming]
  return items.map((item) =>
    item.productId === incoming.productId
      ? { ...item, quantity: item.quantity + incoming.quantity }
      : item,
  )
}

export function GiftCartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<GiftCart>(emptyCart)
  const [hydrated, setHydrated] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    setCart(readCart())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) writeCart(cart)
  }, [cart, hydrated])

  const persist = useCallback((updater: (prev: GiftCart) => GiftCart) => {
    setCart((prev) => updater(prev))
  }, [])

  const addItem = useCallback(
    (product: DonationProduct, quantity = 1) => {
      persist((prev) => ({
        ...prev,
        items: mergeItem(prev.items, productToCartItem(product, quantity)),
        updatedAt: new Date().toISOString(),
      }))
      setDrawerOpen(true)
    },
    [persist],
  )

  const removeItem = useCallback(
    (productId: string) => {
      persist((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.productId !== productId),
        updatedAt: new Date().toISOString(),
      }))
    },
    [persist],
  )

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity < 1) {
        removeItem(productId)
        return
      }
      persist((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.productId === productId ? { ...item, quantity } : item,
        ),
        updatedAt: new Date().toISOString(),
      }))
    },
    [persist, removeItem],
  )

  const clearCart = useCallback(() => {
    persist(() => emptyCart())
  }, [persist])

  const restoreCart = useCallback(
    (items: GiftCartItem[]) => {
      persist(() => ({
        items,
        updatedAt: new Date().toISOString(),
      }))
    },
    [persist],
  )

  const value = useMemo<GiftCartContextValue>(
    () => ({
      cart,
      itemCount: cartItemCount(cart),
      subtotal: cartSubtotal(cart),
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      restoreCart,
    }),
    [cart, drawerOpen, addItem, removeItem, updateQuantity, clearCart, restoreCart],
  )

  return <GiftCartContext.Provider value={value}>{children}</GiftCartContext.Provider>
}

export function useGiftCart() {
  const ctx = useContext(GiftCartContext)
  if (!ctx) throw new Error('useGiftCart must be used within GiftCartProvider')
  return ctx
}
