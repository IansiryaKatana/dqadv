import { createServerFn } from '@tanstack/react-start'
import { getSupabaseAdmin } from '#/lib/integrations/supabaseAdmin'
import type { GiftCartItem } from './types'
import { parseCommerceSnapshot, type CommerceSnapshot } from './checkoutShared'

export type DonationPublic = {
  reference: string
  donorName: string
  donorEmail: string
  total: number
  currency: string
  paymentStatus: string
  paymentProvider: string | null
  dedication: string | null
  items: GiftCartItem[]
  snapshot: CommerceSnapshot | null
  orderKind: 'donation' | 'quran_order'
  frequency: 'one_time' | 'monthly'
  itemsSubtotal: number
  postageTotal: number
  createdAt: string
}

export const getDonationByReference = createServerFn({ method: 'POST' })
  .validator((data: { reference: string }) => data)
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin()
    if (!admin || !data.reference) return null

    const { data: row } = await admin
      .from('dq_donations')
      .select(
        'reference, donor_name, donor_email, total, currency, payment_status, payment_provider, dedication, cart_snapshot, created_at, order_kind, frequency, items_subtotal, postage_total',
      )
      .eq('reference', data.reference)
      .maybeSingle()

    if (!row) return null

    return {
      reference: row.reference,
      donorName: row.donor_name,
      donorEmail: row.donor_email,
      total: Number(row.total),
      currency: row.currency,
      paymentStatus: row.payment_status,
      paymentProvider: row.payment_provider,
      dedication: row.dedication,
      items: (Array.isArray(row.cart_snapshot) ? row.cart_snapshot : []) as GiftCartItem[],
      snapshot: parseCommerceSnapshot(row.cart_snapshot),
      orderKind: row.order_kind === 'quran_order' ? 'quran_order' : 'donation',
      frequency: row.frequency === 'monthly' ? 'monthly' : 'one_time',
      itemsSubtotal: Number(row.items_subtotal ?? 0),
      postageTotal: Number(row.postage_total ?? 0),
      createdAt: row.created_at,
    } satisfies DonationPublic
  })

export const getDonorDonations = createServerFn({ method: 'POST' })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }) => {
    const { getSupabaseUserClient } = await import('#/lib/integrations/supabaseAdmin')
    const userClient = getSupabaseUserClient(data.accessToken)
    if (!userClient) return []

    const { data: userData } = await userClient.auth.getUser()
    if (!userData.user) return []

    const admin = getSupabaseAdmin()
    if (!admin) return []

    const email = userData.user.email?.toLowerCase() ?? ''
    const [byUser, byEmail] = await Promise.all([
      admin
        .from('dq_donations')
        .select(
          'reference, donor_name, total, currency, payment_status, payment_provider, created_at, order_kind, frequency',
        )
        .eq('donor_user_id', userData.user.id)
        .order('created_at', { ascending: false }),
      admin
        .from('dq_donations')
        .select(
          'reference, donor_name, total, currency, payment_status, payment_provider, created_at, order_kind, frequency',
        )
        .is('donor_user_id', null)
        .eq('donor_email', email)
        .order('created_at', { ascending: false }),
    ])

    const merged = [...(byUser.data ?? []), ...(byEmail.data ?? [])]
    const unique = new Map(merged.map((row) => [row.reference, row]))

    return [...unique.values()].map((row) => ({
      reference: row.reference,
      donorName: row.donor_name,
      total: Number(row.total),
      currency: row.currency,
      paymentStatus: row.payment_status,
      paymentProvider: row.payment_provider,
      createdAt: row.created_at,
      orderKind: row.order_kind === 'quran_order' ? 'quran_order' : 'donation',
      frequency: row.frequency === 'monthly' ? 'monthly' : 'one_time',
    }))
  })
