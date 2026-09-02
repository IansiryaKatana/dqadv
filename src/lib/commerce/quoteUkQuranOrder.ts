export type PostageBand = 'copies' | 'boxes'

export type PostageTier = {
  band: PostageBand
  quantity: number
  copies: number
  cost: number
  postage: number
  total: number
  sortOrder: number
}

export type QuranQuote = {
  band: PostageBand
  quantity: number
  copies: number
  boxes: number
  cost: number
  postage: number
  total: number
  label: string
}

export const UK_COUNTRY_NAME = 'United Kingdom'
export const UK_COUNTRY_CODE = 'GB'
export const MAX_COPY_QTY = 9
export const MAX_BOX_QTY = 15

/** Spreadsheet fallback if the database table is empty. */
export const DEFAULT_POSTAGE_TIERS: PostageTier[] = [
  { band: 'copies', quantity: 1, copies: 1, cost: 0, postage: 7.5, total: 7.5, sortOrder: 1 },
  { band: 'copies', quantity: 2, copies: 2, cost: 10, postage: 2.5, total: 12.5, sortOrder: 2 },
  { band: 'copies', quantity: 3, copies: 3, cost: 13, postage: 2, total: 15, sortOrder: 3 },
  { band: 'copies', quantity: 4, copies: 4, cost: 13, postage: 2, total: 15, sortOrder: 4 },
  { band: 'copies', quantity: 5, copies: 5, cost: 15, postage: 2.5, total: 17.5, sortOrder: 5 },
  { band: 'copies', quantity: 6, copies: 6, cost: 18, postage: 2, total: 20, sortOrder: 6 },
  { band: 'copies', quantity: 7, copies: 7, cost: 18, postage: 2, total: 20, sortOrder: 7 },
  { band: 'copies', quantity: 8, copies: 8, cost: 18, postage: 2, total: 20, sortOrder: 8 },
  { band: 'copies', quantity: 9, copies: 9, cost: 18, postage: 2, total: 20, sortOrder: 9 },
  { band: 'boxes', quantity: 1, copies: 10, cost: 20, postage: 5, total: 25, sortOrder: 10 },
  { band: 'boxes', quantity: 2, copies: 20, cost: 25, postage: 5, total: 30, sortOrder: 11 },
  { band: 'boxes', quantity: 3, copies: 30, cost: 30, postage: 5, total: 35, sortOrder: 12 },
  { band: 'boxes', quantity: 4, copies: 40, cost: 40, postage: 5, total: 45, sortOrder: 13 },
  { band: 'boxes', quantity: 5, copies: 50, cost: 45, postage: 10, total: 50, sortOrder: 14 },
  { band: 'boxes', quantity: 6, copies: 60, cost: 50, postage: 15, total: 65, sortOrder: 15 },
  { band: 'boxes', quantity: 7, copies: 70, cost: 55, postage: 20, total: 75, sortOrder: 16 },
  { band: 'boxes', quantity: 8, copies: 80, cost: 60, postage: 25, total: 85, sortOrder: 17 },
  { band: 'boxes', quantity: 9, copies: 90, cost: 65, postage: 30, total: 95, sortOrder: 18 },
  { band: 'boxes', quantity: 10, copies: 100, cost: 70, postage: 35, total: 105, sortOrder: 19 },
  { band: 'boxes', quantity: 11, copies: 110, cost: 100, postage: 50, total: 150, sortOrder: 20 },
  { band: 'boxes', quantity: 12, copies: 120, cost: 120, postage: 60, total: 180, sortOrder: 21 },
  { band: 'boxes', quantity: 13, copies: 130, cost: 130, postage: 75, total: 205, sortOrder: 22 },
  { band: 'boxes', quantity: 14, copies: 140, cost: 140, postage: 85, total: 225, sortOrder: 23 },
  { band: 'boxes', quantity: 15, copies: 150, cost: 160, postage: 100, total: 260, sortOrder: 24 },
]

export function isUkCountry(value: string) {
  const normalised = value.trim().toLowerCase()
  return (
    normalised === 'gb' ||
    normalised === 'uk' ||
    normalised === 'united kingdom' ||
    normalised === 'great britain' ||
    normalised === 'england' ||
    normalised === 'scotland' ||
    normalised === 'wales' ||
    normalised === 'northern ireland'
  )
}

export function quoteUkQuranOrder(
  band: PostageBand,
  quantity: number,
  tiers: PostageTier[] = DEFAULT_POSTAGE_TIERS,
): QuranQuote {
  const qty = Math.floor(quantity)
  const source = tiers.length ? tiers : DEFAULT_POSTAGE_TIERS
  const row = source.find((tier) => tier.band === band && tier.quantity === qty)
  if (!row) {
    if (band === 'boxes' && qty > MAX_BOX_QTY) {
      throw new Error('Orders of 16 or more boxes are arranged through our distributor programme.')
    }
    throw new Error('That quantity is not available. Choose 1–9 copies or 1–15 boxes.')
  }

  const boxes = band === 'boxes' ? row.quantity : 0
  const label =
    band === 'copies'
      ? row.copies === 1
        ? '1 Qur’an'
        : `${row.copies} Qur’ans`
      : `${row.quantity} ${row.quantity === 1 ? 'box' : 'boxes'} (${row.copies} Qur’ans)`

  return {
    band,
    quantity: row.quantity,
    copies: row.copies,
    boxes,
    cost: Number(row.cost),
    postage: Number(row.postage),
    total: Number(row.total),
    label,
  }
}

export function mapPostageTierRow(row: {
  band: string
  quantity: number
  copies: number
  cost: number
  postage: number
  total: number
  sort_order?: number
}): PostageTier {
  return {
    band: row.band === 'boxes' ? 'boxes' : 'copies',
    quantity: Number(row.quantity),
    copies: Number(row.copies),
    cost: Number(row.cost),
    postage: Number(row.postage),
    total: Number(row.total),
    sortOrder: Number(row.sort_order ?? 0),
  }
}
