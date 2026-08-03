import { createServerFn } from '@tanstack/react-start'
import { verifyAdminAccess } from '#/lib/admin/verifyAdminAccess'
import { getSupabaseAdmin } from '#/lib/integrations/supabaseAdmin'
import { getResendClient } from '#/lib/email/resendClient'
import { formReplyHtml } from '#/lib/email/templates'

type ReplyInput = {
  accessToken: string
  submissionId: string
  subject: string
  body: string
}

export const replyToFormSubmission = createServerFn({ method: 'POST' })
  .validator((data: ReplyInput) => data)
  .handler(async ({ data }) => {
    await verifyAdminAccess(data.accessToken)

    const subject = data.subject.trim()
    const body = data.body.trim()
    if (!subject) throw new Error('Subject is required.')
    if (!body) throw new Error('Message is required.')

    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('Server database configuration is missing.')

    const { data: submission, error } = await admin
      .from('dq_form_submissions')
      .select('id, form_type, name, email, message, status')
      .eq('id', data.submissionId)
      .maybeSingle()

    if (error || !submission) throw new Error('Submission not found.')
    if (!submission.email) throw new Error('This submission has no email address.')

    const resend = await getResendClient()
    if (!resend) throw new Error('Email is not configured. Add Resend settings in Payments.')

    const { client, config } = resend
    if (!config.emailFromAddress) {
      throw new Error('From address is not configured. Set it in Payments → Email.')
    }

    const from = config.emailFromName
      ? `${config.emailFromName} <${config.emailFromAddress}>`
      : config.emailFromAddress

    const recipientName = submission.name?.trim() || 'there'
    const html = formReplyHtml({
      recipientName,
      body,
      originalMessage: submission.message,
      formType: submission.form_type,
    })

    const { data: sent, error: sendError } = await client.emails.send({
      from,
      to: submission.email,
      replyTo: config.emailAdminNotify || config.emailFromAddress,
      subject,
      html,
    })

    await admin.from('dq_email_log').insert({
      donation_id: null,
      template: 'form_reply',
      recipient: submission.email,
      resend_id: sent?.id ?? null,
      status: sendError ? 'failed' : 'sent',
      error: sendError?.message ?? null,
    })

    if (sendError) throw new Error(sendError.message)

    await admin
      .from('dq_form_submissions')
      .update({ status: 'replied' })
      .eq('id', submission.id)

    return { ok: true as const, resendId: sent?.id ?? null }
  })
