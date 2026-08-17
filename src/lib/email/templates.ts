import type { GiftCartItem } from '#/lib/commerce/types'
import {
  DISTRIBUTOR_FIELD_LABELS,
  DISTRIBUTOR_SECTIONS,
  FREE_QURAN_FIELD_LABELS,
  FREE_QURAN_SECTIONS,
} from '#/lib/forms/submissionFields'

type DonationEmailData = {
  reference: string
  donorName: string
  donorEmail?: string
  donorPhone?: string | null
  total: number
  currency: string
  dedication?: string | null
  items: GiftCartItem[]
  paymentProvider?: string | null
  shippingAddress?: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  } | null
}

const GOLD = '#c9a227'
const CREAM = '#f7f3ea'
const INK = '#111111'
const MUTED = '#6b6558'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
}

function payloadText(payload: Record<string, unknown> | undefined, key: string) {
  const value = payload?.[key]
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function kvRows(rows: { label: string; value: string; href?: string }[]) {
  const visible = rows.filter((row) => row.value.trim())
  if (!visible.length) return ''

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    ${visible
      .map((row, index) => {
        const valueHtml = row.href
          ? `<a href="${escapeHtml(row.href)}" style="color:${INK};text-decoration:underline;">${escapeHtml(row.value)}</a>`
          : escapeHtml(row.value).replaceAll('\n', '<br/>')
        const border = index === visible.length - 1 ? 'none' : '1px solid #eeebe3'
        return `<tr>
          <td style="width:38%;padding:10px 12px 10px 0;border-bottom:${border};color:${MUTED};font-size:12px;letter-spacing:0.04em;text-transform:uppercase;vertical-align:top;">${escapeHtml(row.label)}</td>
          <td style="padding:10px 0;border-bottom:${border};color:${INK};font-size:15px;line-height:1.5;vertical-align:top;">${valueHtml}</td>
        </tr>`
      })
      .join('')}
  </table>`
}

function section(title: string, inner: string) {
  if (!inner) return ''
  return `<div style="margin:0 0 22px;">
    <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${GOLD};">${escapeHtml(title)}</p>
    ${inner}
  </div>`
}

function brandedEmail(data: {
  title: string
  eyebrow: string
  intro?: string
  body: string
  footer?: string
}) {
  const intro = data.intro
    ? `<p style="margin:0 0 24px;color:${MUTED};font-size:16px;line-height:1.6;">${data.intro}</p>`
    : ''
  const footer = data.footer
    ? `<p style="margin:28px 0 0;color:${MUTED};font-size:13px;line-height:1.6;">${data.footer}</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(data.title)}</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:2px solid ${GOLD};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:1px solid #eeebe3;">
              <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${GOLD};">Donate Quran</p>
              <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${MUTED};">${escapeHtml(data.eyebrow)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 36px;font-family:Georgia,serif;">
              <h1 style="margin:0 0 12px;font-size:28px;font-weight:300;line-height:1.25;color:${INK};">${escapeHtml(data.title)}</h1>
              ${intro}
              ${data.body}
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function itemRows(items: GiftCartItem[]) {
  return items
    .map((item) => {
      const line = (item.unitAmount ?? 0) * item.quantity
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eeebe3;color:${INK};">${escapeHtml(item.title)} × ${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eeebe3;text-align:right;color:${INK};">${formatMoney(line, item.currency)}</td>
      </tr>`
    })
    .join('')
}

function formatShipping(address: DonationEmailData['shippingAddress']) {
  if (!address) return ''
  return [address.line1, address.line2, `${address.city}, ${address.state} ${address.postalCode}`, address.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join('\n')
}

export function formTypeLabel(formType: string) {
  if (formType === 'distributor') return 'distributor application'
  if (formType === 'free_quran') return 'free Qur’an request'
  return 'contact message'
}

export function formTypeTitle(formType: string) {
  if (formType === 'distributor') return 'New distributor application'
  if (formType === 'free_quran') return 'New free Qur’an request'
  return 'New contact message'
}

export function donationReceiptHtml(data: DonationEmailData) {
  const dedication = data.dedication?.trim()
    ? section('Dedication', `<p style="margin:0;color:${INK};font-size:16px;line-height:1.6;font-style:italic;">${escapeHtml(data.dedication.trim())}</p>`)
    : ''

  const body = `
    ${section(
      'Gift reference',
      `<p style="margin:0;font-family:ui-monospace,Menlo,monospace;font-size:16px;color:${INK};">${escapeHtml(data.reference)}</p>`,
    )}
    ${dedication}
    ${section(
      'Your gift',
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${itemRows(data.items)}
        <tr>
          <td style="padding:14px 0 0;font-weight:600;color:${INK};">Total</td>
          <td style="padding:14px 0 0;text-align:right;font-weight:600;color:${INK};">${formatMoney(data.total, data.currency)}</td>
        </tr>
      </table>`,
    )}
  `

  return brandedEmail({
    eyebrow: 'Gift receipt',
    title: 'Your gift is complete',
    intro: `JazakAllah khair, ${escapeHtml(data.donorName)}. Thank you for your generous donation.`,
    body,
    footer: 'Keep this receipt for your records. If you have questions, reply to this email or contact us through the website.',
  })
}

export function adminNewDonationHtml(data: DonationEmailData) {
  const shipping = formatShipping(data.shippingAddress)
  const body = `
    ${section(
      'Gift',
      kvRows([
        { label: 'Reference', value: data.reference },
        { label: 'Total', value: formatMoney(data.total, data.currency) },
        { label: 'Payment', value: data.paymentProvider ? data.paymentProvider : '' },
      ]),
    )}
    ${section(
      'Donor',
      kvRows([
        { label: 'Name', value: data.donorName },
        { label: 'Email', value: data.donorEmail ?? '', href: data.donorEmail ? `mailto:${data.donorEmail}` : undefined },
        { label: 'Phone', value: data.donorPhone ?? '' },
      ]),
    )}
    ${section(
      'Items',
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${itemRows(data.items)}
        <tr>
          <td style="padding:14px 0 0;font-weight:600;color:${INK};">Total</td>
          <td style="padding:14px 0 0;text-align:right;font-weight:600;color:${INK};">${formatMoney(data.total, data.currency)}</td>
        </tr>
      </table>`,
    )}
    ${data.dedication?.trim() ? section('Dedication', `<p style="margin:0;color:${INK};font-size:15px;line-height:1.6;font-style:italic;">${escapeHtml(data.dedication.trim())}</p>`) : ''}
    ${shipping ? section('Delivery address', `<p style="margin:0;color:${INK};font-size:15px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(shipping)}</p>`) : ''}
  `

  return brandedEmail({
    eyebrow: 'Admin notification',
    title: 'New gift received',
    intro: `${escapeHtml(data.donorName)} completed a gift of ${escapeHtml(formatMoney(data.total, data.currency))}.`,
    body,
    footer: 'Review and fulfil this gift in Admin → Donations.',
  })
}

function sectionFromPayload(
  title: string,
  keys: string[],
  labels: Record<string, string>,
  payload: Record<string, unknown>,
) {
  return section(
    title,
    kvRows(
      keys.map((key) => ({
        label: labels[key] ?? key,
        value: payloadText(payload, key),
        href: key === 'email' && payloadText(payload, key) ? `mailto:${payloadText(payload, key)}` : undefined,
      })),
    ),
  )
}

export function adminNewSubmissionHtml(data: {
  formType: string
  name: string
  email: string
  phone?: string | null
  message?: string | null
  payload?: Record<string, unknown>
}) {
  const payload = data.payload ?? {}
  let details = ''

  if (data.formType === 'free_quran') {
    details = FREE_QURAN_SECTIONS.map((block) =>
      sectionFromPayload(block.title, block.keys, FREE_QURAN_FIELD_LABELS, payload),
    ).join('')
  } else if (data.formType === 'distributor') {
    details = DISTRIBUTOR_SECTIONS.map((block) =>
      sectionFromPayload(block.title, block.keys, DISTRIBUTOR_FIELD_LABELS, payload),
    ).join('')
  } else {
    details = `
      ${section(
        'From',
        kvRows([
          { label: 'Name', value: data.name },
          { label: 'Email', value: data.email, href: `mailto:${data.email}` },
          { label: 'Phone', value: data.phone ?? '' },
        ]),
      )}
      ${data.message?.trim()
        ? section(
            'Message',
            `<p style="margin:0;color:${INK};font-size:16px;line-height:1.65;white-space:pre-wrap;">${escapeHtml(data.message.trim())}</p>`,
          )
        : ''}
    `
  }

  return brandedEmail({
    eyebrow: 'Admin notification',
    title: formTypeTitle(data.formType),
    intro: `${escapeHtml(data.name)} submitted a ${escapeHtml(formTypeLabel(data.formType))}. Reply directly to this email to reach them.`,
    body: details,
    footer: 'Review and reply in Admin → Submissions.',
  })
}

export function formReplyHtml(data: {
  recipientName: string
  body: string
  originalMessage?: string | null
  formType: string
}) {
  const paragraphs = escapeHtml(data.body)
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 16px;color:#333;line-height:1.6;">${block.replaceAll('\n', '<br/>')}</p>`)
    .join('')

  const original = data.originalMessage
    ? section(
        'Your message',
        `<p style="margin:0;color:${MUTED};line-height:1.6;white-space:pre-wrap;">${escapeHtml(data.originalMessage)}</p>`,
      )
    : ''

  return brandedEmail({
    eyebrow: 'Donate Quran',
    title: `Reply to your ${formTypeLabel(data.formType)}`,
    intro: `Assalamu alaikum, ${escapeHtml(data.recipientName)},`,
    body: `${paragraphs}${original}`,
    footer: 'You can reply directly to this email.',
  })
}

export function testEmailHtml() {
  return brandedEmail({
    eyebrow: 'Email test',
    title: 'Your email integration is working',
    intro: 'Donate Quran can send branded notifications from this account.',
    body: section(
      'Next step',
      `<p style="margin:0;color:${INK};font-size:15px;line-height:1.6;">Keep the admin notification address set so new gifts and form submissions reach the office.</p>`,
    ),
  })
}
