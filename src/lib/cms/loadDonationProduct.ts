import { createServerFn } from '@tanstack/react-start'
import staticCms from '#/data/static-cms.json'
import { getSupabase } from '#/integrations/supabase/client'
import type { DonationProduct } from './types'

function mapProductRow(r: Record<string, unknown>): DonationProduct {
  return {
    id: r.id as string,
    slug: r.slug as string,
    title: r.title as string,
    description: r.description as string,
    imageUrl: r.image_url as string,
    price: r.price as number | null,
    currency: (r.currency as string) ?? 'GBP',
    category: r.category as string | null,
    stockStatus: r.stock_status as string | null,
    ctaLabel: (r.cta_label as string) ?? 'DONATE NOW',
    ctaUrl: (r.cta_url as string) ?? '/donate',
    kind: (r.kind as 'product' | 'quick' | 'free') ?? 'product',
    sortOrder: r.sort_order as number,
    requiresShipping: (r.requires_shipping as boolean) ?? false,
    isFree:
      Boolean(r.is_free) ||
      r.kind === 'free' ||
      (((r.price as number | null) ?? 0) <= 0 && Boolean(r.requires_shipping)),
    impactStatement: (r.impact_statement as string) ?? null,
    minAmount: (r.min_amount as number) ?? null,
    maxQuantity: (r.max_quantity as number) ?? 99,
  }
}

function staticProducts(): DonationProduct[] {
  return [...staticCms.donationProducts, ...staticCms.quickDonations]
}

function staticProductBySlug(slug: string): DonationProduct | null {
  return staticProducts().find((p) => p.slug === slug) ?? null
}

async function fetchAllDonationProducts(): Promise<DonationProduct[]> {
  const sb = getSupabase()
  if (!sb) return staticProducts()

  try {
    const { data, error } = await sb
      .from('dq_donation_products')
      .select('*')
      .eq('is_active', true)
      .eq('published', true)
      .order('sort_order')

    if (error || !data?.length) return staticProducts()
    return data.map((r) => mapProductRow(r))
  } catch {
    return staticProducts()
  }
}

async function fetchDonationProductBySlug(slug: string): Promise<DonationProduct | null> {
  const sb = getSupabase()
  if (!sb) return staticProductBySlug(slug)

  try {
    const { data, error } = await sb
      .from('dq_donation_products')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .eq('published', true)
      .maybeSingle()

    if (error || !data) return staticProductBySlug(slug)
    return mapProductRow(data)
  } catch {
    return staticProductBySlug(slug)
  }
}

export const loadAllDonationProducts = createServerFn({ method: 'POST', strict: false }).handler(async () =>
  fetchAllDonationProducts(),
)

export const loadDonationProductBySlug = createServerFn({ method: 'POST', strict: false })
  .validator((data: { slug: string }) => data)
  .handler(async ({ data }) => fetchDonationProductBySlug(data.slug))
