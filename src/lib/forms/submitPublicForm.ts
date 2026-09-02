import { createServerFn } from '@tanstack/react-start'
import { getSupabaseAdmin } from '#/lib/integrations/supabaseAdmin'
import { loadEmailBrandGold } from '#/lib/email/brandColors'
import { adminNewSubmissionHtml, formTypeTitle } from '#/lib/email/templates'

export type PublicFormType = 'contact' | 'free_quran' | 'distributor'

export type PublicFormInput = {
  formType: PublicFormType
  name: string
  email: string
  phone?: string | null
  message?: string | null
  payload?: Record<string, unknown>
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FORM_TYPES: PublicFormType[] = ['contact', 'free_quran', 'distributor']

function validatePublicForm(data: PublicFormInput): PublicFormInput {
  const formType = data.formType
  if (!FORM_TYPES.includes(formType)) throw new Error('Invalid form type.')

  const name = data.name.trim()
  const email = data.email.trim().toLowerCase()
  const phone = data.phone?.trim() || null
  const message = data.message?.trim() || null
  const payload = data.payload && typeof data.payload === 'object' && !Array.isArray(data.payload) ? data.payload : {}

  if (!name) throw new Error('Name is required.')
  if (name.length > 200) throw new Error('Name is too long.')
  if (!EMAIL_RE.test(email) || email.length > 200) throw new Error('Please enter a valid email address.')
  if (phone && phone.length > 80) throw new Error('Phone number is too long.')
  if (message && message.length > 8000) throw new Error('Message is too long.')

  return { formType, name, email, phone, message, payload }
}

async function notifyAdminNewSubmission(input: {
  submissionId: string
  formType: string
  name: string
  email: string
  phone?: string | null
  message?: string | null
  payload?: Record<string, unknown>
}) {
  const { getResendClient } = await import('#/lib/email/resendClient')
  const resend = await getResendClient()
  if (!resend?.config.emailAdminNotify || !resend.config.emailFromAddress) return

  const { client, config } = resend
  const from = config.emailFromName
    ? `${config.emailFromName} <${config.emailFromAddress}>`
    : config.emailFromAddress
  const subject = `${formTypeTitle(input.formType)} — ${input.name}`
  const html = adminNewSubmissionHtml(input, { gold: await loadEmailBrandGold() })
  const admin = getSupabaseAdmin()

  try {
    const { data, error } = await client.emails.send({
      from,
      to: config.emailAdminNotify,
      replyTo: input.email,
      subject,
      html,
    })

    if (admin) {
      await admin.from('dq_email_log').insert({
        donation_id: null,
        submission_id: input.submissionId,
        template: 'admin_new_submission',
        recipient: config.emailAdminNotify,
        subject,
        body_html: html,
        resend_id: data?.id ?? null,
        status: error ? 'failed' : 'sent',
        error: error?.message ?? null,
      })
    }
  } catch (e) {
    if (admin) {
      await admin.from('dq_email_log').insert({
        donation_id: null,
        submission_id: input.submissionId,
        template: 'admin_new_submission',
        recipient: config.emailAdminNotify,
        subject,
        status: 'failed',
        error: e instanceof Error ? e.message : 'Send failed',
      })
    }
  }
}

export const submitPublicForm = createServerFn({ method: 'POST' })
  .validator((data: PublicFormInput) => validatePublicForm(data))
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('Server database configuration is missing.')

    const { data: row, error } = await admin
      .from('dq_form_submissions')
      .insert({
        form_type: data.formType,
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        payload: data.payload ?? {},
        status: 'new',
      })
      .select('id')
      .single()

    if (error || !row) throw new Error(error?.message || 'Could not save your submission.')

    await notifyAdminNewSubmission({
      submissionId: row.id,
      formType: data.formType,
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      payload: data.payload,
    })

    return { ok: true as const, id: row.id }
  })
