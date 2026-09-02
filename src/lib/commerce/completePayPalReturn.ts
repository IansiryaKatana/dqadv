import { createServerFn } from '@tanstack/react-start'

export const completePayPalReturn = createServerFn({ method: 'POST' })
  .validator(
    (data: { reference: string; token?: string; subscription_id?: string }) => data,
  )
  .handler(async ({ data }) => {
    const { runCompletePayPalReturn } = await import('./completePayPalReturn.server')
    return runCompletePayPalReturn(data)
  })
