import type { GiftCartItem } from '#/lib/commerce/types'
import { getSupabaseAdmin } from '#/lib/integrations/supabaseAdmin'
import { getResendClient } from './resendClient'
import { loadEmailBrandGold } from './brandColors'
import { adminNewDonationHtml, donationReceiptHtml, testEmailHtml } from './templates'

type DonationRow = {
  id: string
  reference: string
  donor_name: string
  donor_email: string
  donor_phone?: string | null
  dedication?: string | null
  total: number
  currency: string
  cart_snapshot: unknown
  payment_provider?: string | null
  shipping_address?: unknown
}

function parseItems(snapshot: unknown): GiftCartItem[] {
  if (!Array.isArray(snapshot)) return []
  return snapshot as GiftCartItem[]
}

function parseShipping(value: unknown): {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
} | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const row = value as Record<string, unknown>
  const line1 = typeof row.line1 === 'string' ? row.line1.trim() : ''
  const city = typeof row.city === 'string' ? row.city.trim() : ''
  const state = typeof row.state === 'string' ? row.state.trim() : ''
  const postalCode = typeof row.postalCode === 'string' ? row.postalCode.trim() : ''
  const country = typeof row.country === 'string' ? row.country.trim() : ''
  if (!line1 && !city && !country) return null
  return {
    line1,
    line2: typeof row.line2 === 'string' ? row.line2.trim() : undefined,
    city,
    state,
    postalCode,
    country,
  }
}

async function logEmail(
  donationId: string,
  template: string,
  recipient: string,
  status: 'sent' | 'failed',
  resendId?: string,
  error?: string,
) {
  const admin = getSupabaseAdmin()
  if (!admin) return
  await admin.from('dq_email_log').insert({
    donation_id: donationId,
    template,
    recipient,
    resend_id: resendId ?? null,
    status,
    error: error ?? null,
  })
}

export async function sendDonationEmails(donation: DonationRow) {
  const resend = await getResendClient()
  if (!resend) return

  const { client, config } = resend
  const from = config.emailFromName
    ? `${config.emailFromName} <${config.emailFromAddress}>`
    : config.emailFromAddress

  if (!from || !config.emailFromAddress) return

  const items = parseItems(donation.cart_snapshot)
  const brand = { gold: await loadEmailBrandGold() }
  const payload = {
    reference: donation.reference,
    donorName: donation.donor_name,
    donorEmail: donation.donor_email,
    donorPhone: donation.donor_phone,
    total: Number(donation.total),
    currency: donation.currency,
    dedication: donation.dedication,
    items,
    paymentProvider: donation.payment_provider,
    shippingAddress: parseShipping(donation.shipping_address),
  }

  let receiptSent = false

  try {
    const { data, error } = await client.emails.send({
      from,
      to: donation.donor_email,
      subject: `Your gift is complete — ${donation.reference}`,
      html: donationReceiptHtml(payload, brand),
    })
    await logEmail(
      donation.id,
      'donation_receipt',
      donation.donor_email,
      error ? 'failed' : 'sent',
      data?.id,
      error?.message,
    )
    receiptSent = !error
  } catch (e) {
    await logEmail(
      donation.id,
      'donation_receipt',
      donation.donor_email,
      'failed',
      undefined,
      e instanceof Error ? e.message : 'Send failed',
    )
  }

  if (config.emailAdminNotify) {
    try {
      const { data, error } = await client.emails.send({
        from,
        to: config.emailAdminNotify,
        replyTo: donation.donor_email,
        subject: `New gift — ${donation.reference}`,
        html: adminNewDonationHtml(payload, brand),
      })
      await logEmail(
        donation.id,
        'admin_new_donation',
        config.emailAdminNotify,
        error ? 'failed' : 'sent',
        data?.id,
        error?.message,
      )
    } catch (e) {
      await logEmail(
        donation.id,
        'admin_new_donation',
        config.emailAdminNotify,
        'failed',
        undefined,
        e instanceof Error ? e.message : 'Send failed',
      )
    }
  }

  if (receiptSent) {
    const admin = getSupabaseAdmin()
    if (admin) {
      await admin
        .from('dq_donations')
        .update({ email_receipt_sent_at: new Date().toISOString() })
        .eq('id', donation.id)
    }
  }
}

export async function resendDonationReceipt(donationId: string) {
  const admin = getSupabaseAdmin()
  if (!admin) throw new Error('Server database configuration is missing.')

  const { data, error } = await admin.from('dq_donations').select('*').eq('id', donationId).single()
  if (error || !data) throw new Error('Donation not found.')
  if (data.payment_status !== 'paid') throw new Error('Receipts are only sent for completed gifts.')

  await sendDonationEmails(data as DonationRow)
}

export async function sendTestEmail(to: string) {
  const resend = await getResendClient()
  if (!resend) throw new Error('Email is not configured yet.')

  const { client, config } = resend
  const from = `${config.emailFromName || 'Donate Quran'} <${config.emailFromAddress}>`

  const { error } = await client.emails.send({
    from,
    to,
    subject: 'Donate Quran — test email',
    html: testEmailHtml({ gold: await loadEmailBrandGold() }),
  })

  if (error) throw new Error(error.message)
}
