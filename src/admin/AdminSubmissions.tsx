import { useEffect, useMemo, useState } from 'react'
import { useMarkInboxViewed } from '#/admin/AdminInboxContext'
import { getSupabase } from '#/integrations/supabase/client'
import { useAdminAuth } from '#/contexts/AdminAuthContext'
import { replyToFormSubmission } from '#/lib/admin/replyToFormSubmission'
import { formReplyHtml } from '#/lib/email/templates'
import { useAdminPageHeader } from './AdminPageContext'
import { AdminModal } from './components/AdminModal'
import { adminTable, adminTableWrap, adminTd, adminTh } from './adminClassNames'
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

const DISTRIBUTOR_FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  firstName: 'First name',
  lastName: 'Last name',
  companyName: 'Company / organisation',
  email: 'Email',
  website: 'Website',
  addressLine1: 'Address line 1',
  addressLine2: 'Address line 2',
  city: 'City',
  country: 'Country',
  stateProvince: 'State / province',
  zipPostalCode: 'ZIP / postal code',
  primaryPhone: 'Primary phone',
  secondaryPhone: 'Secondary phone',
  hearAboutUs: 'How they heard about us',
  contactReason: 'Why they contacted us',
  channelDescription: 'Distribution channel',
  distributingCountry: 'Distributing country',
  distributingArea: 'Distributing area',
  storageLocation: 'Storage location',
  distributeTo: 'Who they distribute to',
  raisingFunds: 'Raising funds',
  approximateQuantity: 'Approximate quantity',
  whyDistribute: 'Why they want to distribute',
  yearsInBusiness: 'Years in business',
  companyDescription: 'Company description',
}

const DISTRIBUTOR_SECTIONS: { title: string; keys: string[] }[] = [
  {
    title: 'Applicant',
    keys: ['title', 'firstName', 'lastName', 'companyName', 'email', 'website'],
  },
  {
    title: 'Location',
    keys: [
      'addressLine1',
      'addressLine2',
      'city',
      'stateProvince',
      'zipPostalCode',
      'country',
      'primaryPhone',
      'secondaryPhone',
    ],
  },
  {
    title: 'Distribution',
    keys: [
      'hearAboutUs',
      'contactReason',
      'channelDescription',
      'distributingCountry',
      'distributingArea',
      'storageLocation',
      'distributeTo',
      'raisingFunds',
      'approximateQuantity',
    ],
  },
  {
    title: 'About the organisation',
    keys: ['whyDistribute', 'yearsInBusiness', 'companyDescription'],
  },
]

const FREE_QURAN_FIELD_LABELS: Record<string, string> = {
  productTitle: 'Product',
  productSlug: 'Product slug',
  quantity: 'Quantity',
  fullName: 'Full name',
  email: 'Email',
  phone: 'Phone',
  addressLine1: 'Address line 1',
  addressLine2: 'Address line 2',
  city: 'City',
  state: 'State / county',
  postalCode: 'Postal code',
  country: 'Country',
  note: 'Note',
}

const FREE_QURAN_SECTIONS: { title: string; keys: string[] }[] = [
  {
    title: 'Request',
    keys: ['productTitle', 'quantity', 'fullName', 'email', 'phone'],
  },
  {
    title: 'Delivery',
    keys: ['addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country', 'note'],
  },
]

type SubmissionTab = 'contact' | 'distributor' | 'free_quran'

function formatStatus(status: string) {
  if (!status) return 'New'
  return status.charAt(0).toUpperCase() + status.slice(1)
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
      <p className="border-b border-[#ebebeb] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#737373]">
        {title}
      </p>
      <iframe title={title} srcDoc={html} className="h-72 w-full bg-white" sandbox="" />
    </div>
  )
}

export function AdminSubmissions() {
  useMarkInboxViewed('submissions')
  const { session } = useAdminAuth()
  const [tab, setTab] = useState<SubmissionTab>('contact')
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
  const [showComposePreview, setShowComposePreview] = useState(false)

  useAdminPageHeader({
    title: 'Form submissions',
    description: 'Review contact messages, free Qur’an requests, and distributor applications.',
    actions: [],
  })

  useEffect(() => {
    async function load() {
      const sb = getSupabase()
      if (!sb) return
      const { data, error } = await sb
        .from('dq_form_submissions')
        .select('*')
        .eq('form_type', tab)
        .order('created_at', { ascending: false })
      if (error) setErr(error.message)
      else setRows((data ?? []) as SubmissionRow[])
    }
    void load()
  }, [tab])

  useEffect(() => {
    if (!selected) {
      setReplyHistory([])
      setPreviewReplyId(null)
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
    setShowComposePreview(false)
    setPreviewReplyId(null)

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
    return formReplyHtml({
      recipientName: selected.name?.trim() || 'there',
      body: replyBody.trim(),
      originalMessage: selected.message,
      formType: selected.form_type,
    })
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
      }
      setReplyBody('')
      setShowComposePreview(false)
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

  return (
    <div>
      {err ? <p className="mb-4 text-sm text-red-500">{err}</p> : null}
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { id: 'contact', label: 'Contact' },
            { id: 'free_quran', label: 'Free Qur’an' },
            { id: 'distributor', label: 'Distributor' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            className={cn('admin-btn-secondary', tab === t.id && 'ring-2 ring-dq-gold')}
            onClick={() => {
              setTab(t.id)
              setSelected(null)
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
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
                  No {tab === 'free_quran' ? 'free Qur’an' : tab} submissions yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer hover:bg-[#fafafa]"
                  onClick={() => setSelected(row)}
                >
                  <td className={adminTd}>{row.name}</td>
                  <td className={adminTd}>{row.email}</td>
                  <td className={adminTd}>{formatStatus(row.status)}</td>
                  <td className={adminTd}>{new Date(row.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminModal
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        title={selected?.name || 'Submission'}
        wide
      >
        {selected ? (
          <div className="space-y-5">
            <p className="admin-muted text-sm">
              {selected.email}
              {selected.phone ? ` · ${selected.phone}` : ''}
              {' · '}
              {formatStatus(selected.status)}
              {' · '}
              {new Date(selected.created_at).toLocaleString()}
            </p>

            {selected.form_type === 'contact' ? (
              <div className="space-y-4">
                <FieldGrid
                  entries={[
                    { label: 'Name', value: selected.name || '' },
                    { label: 'Email', value: selected.email || '' },
                    { label: 'Phone', value: selected.phone || '' },
                    {
                      label: 'Submitted',
                      value: selected.created_at ? new Date(selected.created_at).toLocaleString() : '',
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
            )}

            <div className="border-t border-[#ebebeb] pt-4">
              <h4 className="text-sm font-semibold text-dq-black">Reply history</h4>
              <p className="admin-muted mt-1 text-sm">All emails sent for this submission.</p>
              {historyLoading ? (
                <p className="mt-3 text-sm text-[#737373]">Loading replies…</p>
              ) : replyHistory.length === 0 ? (
                <p className="mt-3 text-sm text-[#737373]">No replies sent yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {replyHistory.map((reply) => {
                    const active = previewReplyId === reply.id
                    return (
                      <li key={reply.id}>
                        <button
                          type="button"
                          className={cn(
                            'w-full rounded-lg border px-3 py-2.5 text-left transition-colors',
                            active ? 'border-dq-gold bg-[#fbf8ef]' : 'border-[#ebebeb] hover:bg-[#fafafa]',
                          )}
                          onClick={() => setPreviewReplyId(active ? null : reply.id)}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-medium text-dq-black">
                              {reply.subject || '(no subject)'}
                            </span>
                            <span className="text-xs text-[#737373]">
                              {formatStatus(reply.status)} · {new Date(reply.created_at).toLocaleString()}
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
              {previewedReply?.body_html ? (
                <div className="mt-3">
                  <EmailPreviewFrame html={previewedReply.body_html} title="Sent email preview" />
                </div>
              ) : null}
            </div>

            <div className="border-t border-[#ebebeb] pt-4">
              <h4 className="text-sm font-semibold text-dq-black">Reply by email</h4>
              <p className="admin-muted mt-1 text-sm">
                Sends via Resend to {selected.email}. Replies go to your admin notify address when configured.
              </p>
              <div className="mt-3 space-y-3">
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
                    onClick={() => setShowComposePreview((v) => !v)}
                  >
                    {showComposePreview ? 'Hide preview' : 'Preview email'}
                  </button>
                </div>
                {showComposePreview && composePreviewHtml ? (
                  <EmailPreviewFrame html={composePreviewHtml} title="Draft email preview" />
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </AdminModal>
    </div>
  )
}
