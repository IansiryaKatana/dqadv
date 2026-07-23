import { useEffect, useState } from 'react'
import { getSupabase } from '#/integrations/supabase/client'
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

export function AdminSubmissions() {
  const [tab, setTab] = useState<'contact' | 'distributor'>('contact')
  const [rows, setRows] = useState<SubmissionRow[]>([])
  const [selected, setSelected] = useState<SubmissionRow | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useAdminPageHeader({
    title: 'Form submissions',
    description: 'Contact and distributor applications.',
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

  return (
    <div>
      {err ? <p className="mb-4 text-sm text-red-400">{err}</p> : null}
      <div className="mb-4 flex gap-2">
        {(['contact', 'distributor'] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={cn('admin-btn-secondary capitalize', tab === t && 'ring-2 ring-dq-gold')}
            onClick={() => setTab(t)}
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
              <th className={adminTh}>Date</th>
              <th className={adminTh} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className={adminTd}>{row.name}</td>
                <td className={adminTd}>{row.email}</td>
                <td className={adminTd}>{new Date(row.created_at).toLocaleString()}</td>
                <td className={adminTd}>
                  <button type="button" className="admin-btn-secondary" onClick={() => setSelected(row)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected ? (
        <div className="admin-panel mt-4 space-y-2 p-4">
          <div className="flex justify-between">
            <h3 className="font-semibold">{selected.name}</h3>
            <button type="button" className="admin-btn-secondary" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
          <p className="admin-muted text-sm">{selected.email}</p>
          {selected.message ? <p className="text-sm">{selected.message}</p> : null}
          <pre className="max-h-96 overflow-auto rounded bg-black/5 p-3 text-xs">
            {JSON.stringify(selected.payload, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  )
}
