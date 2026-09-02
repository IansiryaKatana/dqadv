import { createServerFn } from '@tanstack/react-start'
import { getSupabaseAdmin } from '#/lib/integrations/supabaseAdmin'
import { DEFAULT_DONATE_PRESETS, type DonatePreset } from './donateAmounts'
import {
  DEFAULT_POSTAGE_TIERS,
  mapPostageTierRow,
  type PostageTier,
} from './quoteUkQuranOrder'

export const loadDonatePresets = createServerFn({ method: 'POST' }).handler(async () => {
  const admin = getSupabaseAdmin()
  if (!admin) {
    return DEFAULT_DONATE_PRESETS.map((amount, index) => ({
      id: `fallback-${amount}`,
      amount,
      currency: 'GBP',
      sortOrder: index + 1,
    })) satisfies DonatePreset[]
  }

  const { data, error } = await admin
    .from('dq_donate_presets')
    .select('id, amount, currency, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order')

  if (error || !data?.length) {
    return DEFAULT_DONATE_PRESETS.map((amount, index) => ({
      id: `fallback-${amount}`,
      amount,
      currency: 'GBP',
      sortOrder: index + 1,
    })) satisfies DonatePreset[]
  }

  return data.map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    currency: row.currency ?? 'GBP',
    sortOrder: Number(row.sort_order ?? 0),
  })) satisfies DonatePreset[]
})

export const loadPostageTiers = createServerFn({ method: 'POST' }).handler(async () => {
  const admin = getSupabaseAdmin()
  if (!admin) return DEFAULT_POSTAGE_TIERS

  const { data, error } = await admin
    .from('dq_quran_postage_tiers')
    .select('band, quantity, copies, cost, postage, total, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order')

  if (error || !data?.length) return DEFAULT_POSTAGE_TIERS

  return data.map((row) =>
    mapPostageTierRow({
      band: row.band,
      quantity: Number(row.quantity),
      copies: Number(row.copies),
      cost: Number(row.cost),
      postage: Number(row.postage),
      total: Number(row.total),
      sort_order: Number(row.sort_order ?? 0),
    }),
  ) satisfies PostageTier[]
})
