export const DONATE_CURRENCY = 'GBP'
export const DONATE_MIN_AMOUNT = 1
export const DONATE_MAX_AMOUNT = 10000
export const DEFAULT_DONATE_PRESETS = [10, 25, 50, 100]

export type GiftFrequency = 'one_time' | 'monthly'

export type DonatePreset = {
  id: string
  amount: number
  currency: string
  sortOrder: number
}

export function parseDonationAmount(value: unknown): number {
  const amount = typeof value === 'number' ? value : Number(String(value ?? '').replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(amount)) throw new Error('Enter a gift amount.')
  const rounded = Math.round(amount * 100) / 100
  if (rounded < DONATE_MIN_AMOUNT) {
    throw new Error(`The minimum gift is £${DONATE_MIN_AMOUNT}.`)
  }
  if (rounded > DONATE_MAX_AMOUNT) {
    throw new Error(`The maximum online gift is £${DONATE_MAX_AMOUNT.toLocaleString('en-GB')}.`)
  }
  return rounded
}

export function parseFrequency(value: unknown): GiftFrequency {
  return value === 'monthly' ? 'monthly' : 'one_time'
}
