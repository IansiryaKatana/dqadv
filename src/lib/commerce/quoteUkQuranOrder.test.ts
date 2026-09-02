import { describe, expect, it } from 'vitest'
import { quoteUkQuranOrder } from './quoteUkQuranOrder'

describe('quoteUkQuranOrder', () => {
  it('prices a single copy as postage only', () => {
    const quote = quoteUkQuranOrder('copies', 1)
    expect(quote.cost).toBe(0)
    expect(quote.postage).toBe(7.5)
    expect(quote.total).toBe(7.5)
    expect(quote.copies).toBe(1)
  })

  it('uses the spreadsheet totals for copies and boxes', () => {
    expect(quoteUkQuranOrder('copies', 2).total).toBe(12.5)
    expect(quoteUkQuranOrder('copies', 9).total).toBe(20)
    expect(quoteUkQuranOrder('boxes', 1).total).toBe(25)
    expect(quoteUkQuranOrder('boxes', 10).total).toBe(105)
    expect(quoteUkQuranOrder('boxes', 11).total).toBe(150)
    expect(quoteUkQuranOrder('boxes', 15).copies).toBe(150)
  })

  it('rejects mixed copy counts and oversized box orders', () => {
    expect(() => quoteUkQuranOrder('copies', 11)).toThrow(/1–9 copies/)
    expect(() => quoteUkQuranOrder('boxes', 16)).toThrow(/distributor/)
  })
})
