import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number | null | undefined, currency = 'GBP') {
  if (amount == null) return null
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
}
