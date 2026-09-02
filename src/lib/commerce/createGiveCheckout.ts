import { createServerFn } from '@tanstack/react-start'

export type GiveCheckoutInput = {
  amount: number
  frequency: 'one_time' | 'monthly'
  donorName: string
  donorEmail: string
  donorPhone?: string
  dedication?: string
  donorUserId?: string | null
  paymentMethod: 'stripe' | 'paypal'
  successUrl: string
  cancelUrl: string
}

export const createGiveCheckout = createServerFn({ method: 'POST' })
  .validator((data: GiveCheckoutInput) => data)
  .handler(async ({ data }) => {
    const { runGiveCheckout } = await import('./createGiveCheckout.server')
    return runGiveCheckout(data)
  })
