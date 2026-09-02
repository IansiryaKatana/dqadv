import { createServerFn } from '@tanstack/react-start'
import type { PostageBand } from './quoteUkQuranOrder'

export type QuranOrderCheckoutInput = {
  band: PostageBand
  quantity: number
  donorName: string
  donorEmail: string
  donorPhone?: string
  dedication?: string
  donorUserId?: string | null
  shippingAddress: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  paymentMethod: 'stripe' | 'paypal'
  successUrl: string
  cancelUrl: string
}

export const createQuranOrderCheckout = createServerFn({ method: 'POST' })
  .validator((data: QuranOrderCheckoutInput) => data)
  .handler(async ({ data }) => {
    const { runQuranOrderCheckout } = await import('./createQuranOrderCheckout.server')
    return runQuranOrderCheckout(data)
  })
