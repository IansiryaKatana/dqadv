import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '#/integrations/supabase/client'
import { useAdminAuth } from '#/contexts/AdminAuthContext'
import { replyToFormSubmission } from '#/lib/admin/replyToFormSubmission'
import { useAdminPageHeader } from './AdminPageContext'
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

export function AdminSubmissions() {
  const { session } = useAdminAuth()
  const [tab, setTab] = useState<'contact' | 'distributor'>('contact')
  const [rows, setRows] = useState<SubmissionRow[]>([])
  const [selected, setSelected] = useState<SubmissionRow | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [replySubject, setReplySubject] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [replyStatus, setReplyStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [replyError, setReplyError] = useState<string | null>(null)

  useAdminPageHeader({
    title: 'Form submissions',
    description: 'Review contact and distributor applications, then reply by email.',
    actions: [],
  })

  useEffect(() => {
    async function load() {
      const sb = getSupabase()
      if (!sb) return
      const formType = tab === 'contact' ? 'contact' : 'distributor'
      const { data, error } = await sb
        .from('dq_form_submissions')
        .select('*')
        .eq('form_type', formType)
        .order('created_at', { ascending: false })
      if (error) setErr(error.message)
      else setRows((data ?? []) as SubmissionRow[])
    }
    void load()
  }, [tab])

  useEffect(() => {
    if (!selected) return
    const kind = selected.form_type === 'distributor' ? 'distributor application' : 'message'
    setReplySubject(`Re: Your Donate Quran ${kind}`)
    setReplyBody('')
    setReplyStatus('idle')
    setReplyError(null)
  }, [selected?.id])

  const detailEntries = useMemo(() => {
    if (!selected) return [] as { label: string; value: string }[]
    if (selected.form_type === 'contact') {
      return [
        { label: 'Name', value: selected.name || '' },
        { label: 'Email', value: selected.email || '' },
        { label: 'Phone', value: selected.phone || '' },
        { label: 'Submitted', value: selected.created_at ? new Date(selected.created_at).toLocaleString() : '' },
        { label: 'Status', value: formatStatus(selected.status) },
      ]
    }

    const payload = selected.payload ?? {}
    return Object.entries(DISTRIBUTOR_FIELD_LABELS).map(([key, label]) => ({
      label,
      value: String(payload[key] ?? (key === 'email' ? selected.email : '') ?? ''),
    }))
  }, [selected])

  async function handleReply() {
    if (!selected || !session?.access_token) {
      setReplyError('Sign in again to send a reply.')
      setReplyStatus('error')
      return
    }
    setReplyStatus('sending')
    setReplyError(null)
    try {
      await replyToFormSubmission({
        data: {
          accessToken: session.access_token,
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
    } catch (e) {
      setReplyStatus('error')
      setReplyError(e instanceof Error ? e.message : 'Could not send reply.')
    }
  }

  return (
    <div>
      {err ? <p className="mb-4 text-sm text-red-500">{err}</p> : null}
      <div className="mb-4 flex gap-2">
        {(['contact', 'distributor'] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={cn('admin-btn-secondary capitalize', tab === t && 'ring-2 ring-dq-gold')}
            onClick={() => {
              setTab(t)
              setSelected(null)
            }}
          >
            {t}
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
              <th className={adminTh} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className={adminTd} colSpan={5}>
                  No {tab} submissions yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className={adminTd}>{row.name}</td>
                  <td className={adminTd}>{row.email}</td>
                  <td className={adminTd}>{formatStatus(row.status)}</td>
                  <td className={adminTd}>{new Date(row.created_at).toLocaleString()}</td>
                  <td className={adminTd}>
                    <button type="button" className="admin-btn-secondary" onClick={() => setSelected(row)}>
                      Open
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div className="admin-panel mt-4 space-y-5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-dq-black">{selected.name || 'Untitled submission'}</h3>
              <p className="admin-muted mt-1 text-sm">
                {selected.email}
                {selected.phone ? ` · ${selected.phone}` : ''}
                {' · '}
                {formatStatus(selected.status)}
              </p>
            </div>
            <button type="button" className="admin-btn-secondary" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>

          {selected.form_type === 'contact' ? (
            <div className="space-y-4">
              <FieldGrid entries={detailEntries} />
              {selected.message ? (
                <div className="rounded-lg border border-[#ebebeb] bg-white px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#737373]">Message</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-dq-black">{selected.message}</p>
                </div>
              ) : null}
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
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
