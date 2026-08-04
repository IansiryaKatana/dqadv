import type { GiftCartItem } from '#/lib/commerce/types'

type DonationEmailData = {
  reference: string
  donorName: string
  total: number
  currency: string
  dedication?: string | null
  items: GiftCartItem[]
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
}

function itemRows(items: GiftCartItem[]) {
  return items
    .map((item) => {
      const line = (item.unitAmount ?? 0) * item.quantity
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">${item.title} × ${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatMoney(line, item.currency)}</td>
      </tr>`
    })
    .join('')
}

export function donationReceiptHtml(data: DonationEmailData) {
  const dedication = data.dedication
    ? `<p style="margin:16px 0;color:#555;"><em>${data.dedication}</em></p>`
    : ''

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f7f3ea;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#fff;border:2px solid #c9a227;border-radius:16px;padding:32px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#888;">Donate Quran</p>
      <h1 style="margin:0 0 16px;font-size:28px;font-weight:300;color:#111;">Your gift is complete</h1>
      <p style="margin:0 0 24px;color:#555;line-height:1.6;">JazakAllah khair, ${data.donorName}. Thank you for your generous donation.</p>
      <p style="margin:0 0 8px;font-size:12px;color:#888;">Gift reference</p>
      <p style="margin:0 0 24px;font-family:monospace;font-size:16px;color:#111;">${data.reference}</p>
      ${dedication}
      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        ${itemRows(data.items)}
        <tr>
          <td style="padding:12px 0;font-weight:600;color:#111;">Total</td>
          <td style="padding:12px 0;text-align:right;font-weight:600;color:#111;">${formatMoney(data.total, data.currency)}</td>
        </tr>
      </table>
      <p style="margin:0;color:#888;font-size:14px;line-height:1.6;">A receipt for your records. If you have questions, reply to this email or contact us through the website.</p>
    </div>
  </div>
</body>
</html>`
}

export function adminNewDonationHtml(data: DonationEmailData & { donorEmail: string }) {
  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;color:#111;">
  <h2>New gift completed</h2>
  <p><strong>${data.donorName}</strong> (${data.donorEmail}) completed a gift of <strong>${formatMoney(data.total, data.currency)}</strong>.</p>
  <p>Reference: <code>${data.reference}</code></p>
  <p>Review in the admin donations panel.</p>
</body>
</html>`
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
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
    ? `<div style="margin-top:28px;padding-top:20px;border-top:1px solid #eee;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#888;">Your message</p>
        <p style="margin:0;color:#666;line-height:1.6;white-space:pre-wrap;">${escapeHtml(data.originalMessage)}</p>
      </div>`
    : ''

  const kind =
    data.formType === 'distributor'
      ? 'distributor application'
      : data.formType === 'free_quran'
        ? 'free Qur’an request'
        : 'contact message'

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f7f3ea;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#fff;border:2px solid #c9a227;border-radius:16px;padding:32px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#888;">Donate Quran</p>
      <h1 style="margin:0 0 16px;font-size:26px;font-weight:300;color:#111;">Reply to your ${kind}</h1>
      <p style="margin:0 0 24px;color:#555;line-height:1.6;">Assalamu alaikum, ${escapeHtml(data.recipientName)},</p>
      ${paragraphs}
      ${original}
      <p style="margin:28px 0 0;color:#888;font-size:14px;line-height:1.6;">You can reply directly to this email.</p>
    </div>
  </div>
</body>
</html>`
}
