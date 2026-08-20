import { useEffect, useMemo, useState } from 'react'
import { useMarkInboxViewed } from '#/admin/AdminInboxContext'
import { getSupabase } from '#/integrations/supabase/client'
import { useAdminAuth } from '#/contexts/AdminAuthContext'
import { replyToFormSubmission } from '#/lib/admin/replyToFormSubmission'
import { formReplyHtml } from '#/lib/email/templates'
import {
  DISTRIBUTOR_FIELD_LABELS,
  DISTRIBUTOR_SECTIONS,
  FREE_QURAN_FIELD_LABELS,
  FREE_QURAN_SECTIONS,
} from '#/lib/forms/submissionFields'
import { useAdminPageHeader } from './AdminPageContext'
import { AdminModal } from './components/AdminModal'
import { AdminTablePagination } from './components/AdminTablePagination'
import { adminTable, adminTableWrap, adminTd, adminTh } from './adminClassNames'
import { formatAdminDate, formatAdminDateTime, formatAdminTime } from './formatAdminDate'
import { useAdminTablePagination } from './useAdminTablePagination'
import { cn } from '#/lib/utils'

type SubmissionRow = {
  id: string
  form_type: string
  name: string
  email: string
  phone: string | null
  message: string | null
  payload: Record<string, unknown>
  status: string
  created_at: string
}

type ReplyLogRow = {
  id: string
  subject: string | null
  body_text: string | null
  body_html: string | null
  status: string
  error: string | null
  recipient: string
  created_at: string
}

type SubmissionTab = 'contact' | 'distributor' | 'free_quran'
type DetailTab = 'details' | 'reply' | 'history'

const SUBMISSION_PAGES: Record<
  SubmissionTab,
  { title: string; description: string; empty: string }
> = {
  contact: {
    title: 'Contact',
    description: 'Messages sent from the contact form.',
    empty: 'No contact submissions yet.',
  },
  free_quran: {
    title: "Free Qur'an",
    description: 'Requests for a free printed Qur’an.',
    empty: 'No free Qur’an submissions yet.',
  },
  distributor: {
    title: 'Distributor',
    description: 'Applications to distribute Qur’ans.',
    empty: 'No distributor submissions yet.',
  },
}

function formatStatus(status: string) {
  if (!status) return 'New'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const SUBMISSION_STATUS_BADGE_CLASS: Record<string, string> = {
  new: 'bg-amber-100 text-amber-800',
  replied: 'bg-emerald-100 text-emerald-800',
}

const EMAIL_STATUS_BADGE_CLASS: Record<string, string> = {
  sent: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-amber-100 text-amber-800',
}

function StatusBadge({ status, className }: { status: string; className?: string }) {
  const key = status.trim().toLowerCase() || 'new'
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        SUBMISSION_STATUS_BADGE_CLASS[key] ?? EMAIL_STATUS_BADGE_CLASS[key] ?? 'bg-slate-100 text-slate-700',
        className,
      )}
    >
      {formatStatus(key)}
    </span>
  )
}

function FieldGrid({
  entries,
}: {
  entries: { label: string; value: string }[]
}) {
  const visible = entries.filter((e) => e.value.trim())
  if (!visible.length) return null
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {visible.map((entry) => (
        <div key={entry.label} className="rounded-lg bg-black/[0.03] px-3 py-2.5">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#737373]">{entry.label}</dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm text-dq-black">{entry.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function EmailPreviewFrame({ html, title }: { html: string; title: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#ebebeb] bg-[#f7f3ea]">
      <iframe title={title} srcDoc={html} className="h-[min(70vh,40rem)] w-full bg-white" sandbox="" />
    </div>
  )
}

export function AdminSubmissions({ formType }: { formType: SubmissionTab }) {
  useMarkInboxViewed('submissions')
  const { session } = useAdminAuth()
  const pageMeta = SUBMISSION_PAGES[formType]
  const [rows, setRows] = useState<SubmissionRow[]>([])
  const [selected, setSelected] = useState<SubmissionRow | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [replySubject, setReplySubject] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [replyStatus, setReplyStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [replyError, setReplyError] = useState<string | null>(null)
  const [replyHistory, setReplyHistory] = useState<ReplyLogRow[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [previewReplyId, setPreviewReplyId] = useState<string | null>(null)
  const [emailPreview, setEmailPreview] = useState<'compose' | 'sent' | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>('details')

  useAdminPageHeader({
    title: pageMeta.title,
    description: pageMeta.description,
    actions: [],
  })

  useEffect(() => {
    async function load() {
      const sb = getSupabase()
      if (!sb) return
      const { data, error } = await sb
        .from('dq_form_submissions')
        .select('*')
        .eq('form_type', formType)
        .order('created_at', { ascending: false })
      if (error) setErr(error.message)
      else setRows((data ?? []) as SubmissionRow[])
    }
    void load()
  }, [formType])

  const { page, setPage, totalPages, pageRows } = useAdminTablePagination(rows, 12)

  useEffect(() => {
    setPage(1)
    setSelected(null)
  }, [formType, setPage])

  useEffect(() => {
    if (!selected) {
      setReplyHistory([])
      setPreviewReplyId(null)
      setEmailPreview(null)
      setDetailTab('details')
      return
    }
    const kind =
      selected.form_type === 'distributor'
        ? 'distributor application'
        : selected.form_type === 'free_quran'
          ? 'free Qur’an request'
          : 'message'
    setReplySubject(`Re: Your Donate Quran ${kind}`)
    setReplyBody('')
    setReplyStatus('idle')
    setReplyError(null)
    setPreviewReplyId(null)
    setEmailPreview(null)
    setDetailTab('details')

    async function loadHistory() {
      const sb = getSupabase()
      if (!sb || !selected) return
      setHistoryLoading(true)
      const { data, error } = await sb
        .from('dq_email_log')
        .select('id, subject, body_text, body_html, status, error, recipient, created_at')
        .eq('submission_id', selected.id)
        .eq('template', 'form_reply')
        .order('created_at', { ascending: false })
      setHistoryLoading(false)
      if (error) {
        setReplyHistory([])
        return
      }
      setReplyHistory((data ?? []) as ReplyLogRow[])
    }
    void loadHistory()
  }, [selected?.id])

  const composePreviewHtml = useMemo(() => {
    if (!selected || !replyBody.trim()) return null
    return formReplyHtml(
      {
        recipientName: selected.name?.trim() || 'there',
        body: replyBody.trim(),
        originalMessage: selected.message,
        formType: selected.form_type,
      },
      {
        gold:
          typeof document === 'undefined'
            ? undefined
            : getComputedStyle(document.documentElement).getPropertyValue('--dq-gold').trim() || undefined,
      },
    )
  }, [selected, replyBody])

  async function handleReply() {
    const sb = getSupabase()
    const accessToken =
      (sb ? (await sb.auth.getSession()).data.session?.access_token : null) ?? session?.access_token

    if (!selected || !accessToken) {
      setReplyError('Sign in again to send a reply.')
      setReplyStatus('error')
      return
    }
    setReplyStatus('sending')
    setReplyError(null)
    try {
      const result = await replyToFormSubmission({
        data: {
          accessToken,
          submissionId: selected.id,
          subject: replySubject,
          body: replyBody,
        },
      })
      setReplyStatus('sent')
      setRows((prev) =>
        prev.map((row) => (row.id === selected.id ? { ...row, status: 'replied' } : row)),
      )
      setSelected((prev) => (prev ? { ...prev, status: 'replied' } : prev))
      if (result.reply) {
        const entry: ReplyLogRow = {
          id: result.reply.id ?? `local-${Date.now()}`,
          subject: result.reply.subject,
          body_text: result.reply.body_text,
          body_html: result.reply.body_html,
          status: result.reply.status,
          error: null,
          recipient: result.reply.recipient,
          created_at: result.reply.created_at,
        }
        setReplyHistory((prev) => [entry, ...prev])
        setPreviewReplyId(entry.id)
        setEmailPreview('sent')
        setDetailTab('history')
      }
      setReplyBody('')
    } catch (e) {
      setReplyStatus('error')
      const message =
        e instanceof Error
          ? e.message
          : e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string'
            ? (e as { message: string }).message
            : 'Could not send reply.'
      setReplyError(message === 'Forbidden' ? 'Request blocked. Refresh the page and try again.' : message)
    }
  }

  const sheetOpen = Boolean(selected)
  const previewedReply = replyHistory.find((r) => r.id === previewReplyId) ?? null
  const previewHtml =
    emailPreview === 'compose'
      ? composePreviewHtml
      : emailPreview === 'sent'
        ? previewedReply?.body_html ?? null
        : null
  const previewTitle = emailPreview === 'sent' ? 'Sent email' : 'Email preview'

  return (
    <div>
      {err ? <p className="mb-4 text-sm text-red-500">{err}</p> : null}
      <div className={adminTableWrap}>
        <table className={adminTable}>
          <thead>
            <tr>
              <th className={adminTh}>Name</th>
              <th className={adminTh}>Email</th>
              <th className={adminTh}>Status</th>
              <th className={adminTh}>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className={adminTd} colSpan={4}>
                  {pageMeta.empty}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer hover:bg-[#fafafa]"
                  onClick={() => setSelected(row)}
                >
                  <td className={adminTd}>{row.name}</td>
                  <td className={adminTd}>{row.email}</td>
                  <td className={adminTd}>
                    <StatusBadge status={row.status} />
                  </td>
                  <td className={adminTd}>
                    <span className="block text-sm text-dq-black">{formatAdminDate(row.created_at)}</span>
                    <span className="admin-muted text-xs">{formatAdminTime(row.created_at)}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminTablePagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <AdminModal
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open && emailPreview) return
          if (!open) setSelected(null)
        }}
        title={selected?.name || 'Submission'}
        wide
      >
        {selected ? (
          <div className="space-y-5">
            <p className="admin-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span>{selected.email}</span>
              {selected.phone ? <span>· {selected.phone}</span> : null}
              <StatusBadge status={selected.status} />
              <span>· {formatAdminDateTime(selected.created_at)}</span>
            </p>

            <div className="flex flex-wrap gap-2 border-b border-[#ebebeb] pb-3">
              {(
                [
                  { id: 'details', label: 'Details' },
                  { id: 'reply', label: 'Reply' },
                  { id: 'history', label: `History${replyHistory.length ? ` (${replyHistory.length})` : ''}` },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn('admin-btn-secondary', detailTab === item.id && 'ring-2 ring-dq-gold')}
                  onClick={() => setDetailTab(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {detailTab === 'details' ? (
              selected.form_type === 'contact' ? (
                <div className="space-y-4">
                  <FieldGrid
                    entries={[
                      { label: 'Name', value: selected.name || '' },
                      { label: 'Email', value: selected.email || '' },
                      { label: 'Phone', value: selected.phone || '' },
                      {
                        label: 'Submitted',
                        value: selected.created_at ? formatAdminDateTime(selected.created_at) : '',
                      },
                      { label: 'Status', value: formatStatus(selected.status) },
                    ]}
                  />
                  {selected.message ? (
                    <div className="rounded-lg border border-[#ebebeb] bg-white px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#737373]">Message</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-dq-black">{selected.message}</p>
                    </div>
                  ) : null}
                </div>
              ) : selected.form_type === 'free_quran' ? (
                <div className="space-y-5">
                  {FREE_QURAN_SECTIONS.map((section) => {
                    const entries = section.keys.map((key) => ({
                      label: FREE_QURAN_FIELD_LABELS[key] ?? key,
                      value: String(
                        (selected.payload ?? {})[key] ??
                          (key === 'email' ? selected.email : key === 'fullName' ? selected.name : '') ??
                          '',
                      ),
                    }))
                    const hasContent = entries.some((e) => e.value.trim())
                    if (!hasContent) return null
                    return (
                      <section key={section.title}>
                        <h4 className="mb-2 text-sm font-semibold text-dq-black">{section.title}</h4>
                        <FieldGrid entries={entries} />
                      </section>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-5">
                  {DISTRIBUTOR_SECTIONS.map((section) => {
                    const entries = section.keys.map((key) => ({
                      label: DISTRIBUTOR_FIELD_LABELS[key] ?? key,
                      value: String((selected.payload ?? {})[key] ?? (key === 'email' ? selected.email : '') ?? ''),
                    }))
                    const hasContent = entries.some((e) => e.value.trim())
                    if (!hasContent) return null
                    return (
                      <section key={section.title}>
                        <h4 className="mb-2 text-sm font-semibold text-dq-black">{section.title}</h4>
                        <FieldGrid entries={entries} />
                      </section>
                    )
                  })}
                  {selected.message ? (
                    <div className="rounded-lg border border-[#ebebeb] bg-white px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#737373]">Summary message</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-dq-black">{selected.message}</p>
                    </div>
                  ) : null}
                </div>
              )
            ) : null}

            {detailTab === 'history' ? (
              <div>
                <p className="admin-muted text-sm">All emails sent for this submission.</p>
                {historyLoading ? (
                  <p className="mt-3 text-sm text-[#737373]">Loading replies…</p>
                ) : replyHistory.length === 0 ? (
                  <p className="mt-3 text-sm text-[#737373]">No replies sent yet.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {replyHistory.map((reply) => {
                      const active = previewReplyId === reply.id && emailPreview === 'sent'
                      return (
                        <li key={reply.id}>
                          <button
                            type="button"
                            className={cn(
                              'w-full rounded-lg border px-3 py-2.5 text-left transition-colors',
                              active ? 'border-dq-gold bg-[#fbf8ef]' : 'border-[#ebebeb] hover:bg-[#fafafa]',
                            )}
                            onClick={() => {
                              setPreviewReplyId(reply.id)
                              setEmailPreview('sent')
                            }}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-medium text-dq-black">
                                {reply.subject || '(no subject)'}
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-xs text-[#737373]">
                                <StatusBadge status={reply.status} />
                                {formatAdminDateTime(reply.created_at)}
                              </span>
                            </div>
                            {reply.body_text ? (
                              <p className="mt-1 line-clamp-2 text-sm text-[#555]">{reply.body_text}</p>
                            ) : null}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            ) : null}

            {detailTab === 'reply' ? (
              <div className="space-y-3">
                <p className="admin-muted text-sm">
                  Sends via Resend to {selected.email}. Replies go to your admin notify address when configured.
                </p>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#737373]" htmlFor="reply-subject">
                    Subject
                  </label>
                  <input
                    id="reply-subject"
                    className="admin-input"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#737373]" htmlFor="reply-body">
                    Message
                  </label>
                  <textarea
                    id="reply-body"
                    className="admin-input min-h-36"
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Write your reply…"
                  />
                </div>
                {replyError ? <p className="text-sm text-red-500">{replyError}</p> : null}
                {replyStatus === 'sent' ? (
                  <p className="text-sm text-emerald-700">Reply sent. Submission marked as replied.</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="admin-btn-primary"
                    disabled={replyStatus === 'sending' || !replySubject.trim() || !replyBody.trim()}
                    onClick={() => void handleReply()}
                  >
                    {replyStatus === 'sending' ? 'Sending…' : 'Send reply'}
                  </button>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    disabled={!composePreviewHtml}
                    onClick={() => setEmailPreview('compose')}
                  >
                    Preview email
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </AdminModal>

      <AdminModal
        open={Boolean(emailPreview && previewHtml)}
        onOpenChange={(open) => {
          if (!open) setEmailPreview(null)
        }}
        title={previewTitle}
        wide
        stacked
        footer={
          <>
            {emailPreview === 'compose' ? (
              <button
                type="button"
                className="admin-btn-primary"
                disabled={replyStatus === 'sending' || !replySubject.trim() || !replyBody.trim()}
                onClick={() => void handleReply()}
              >
                {replyStatus === 'sending' ? 'Sending…' : 'Send reply'}
              </button>
            ) : null}
            <button type="button" className="admin-btn-secondary" onClick={() => setEmailPreview(null)}>
              Close
            </button>
          </>
        }
      >
        {previewHtml ? <EmailPreviewFrame html={previewHtml} title={previewTitle} /> : null}
      </AdminModal>
    </div>
  )
}
