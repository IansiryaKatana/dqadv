import { useEffect, useState } from 'react'
import { getSupabase } from '#/integrations/supabase/client'
import { useCms } from '#/contexts/CmsContext'
import { useAdminPageHeader } from './AdminPageContext'
import { AdminModal } from './components/AdminModal'
import { AdminTablePagination } from './components/AdminTablePagination'
import { RichTextEditor } from './components/RichTextEditor'
import { useAdminTablePagination } from './useAdminTablePagination'
import { adminTable, adminTableWrap, adminTd, adminTh } from './adminClassNames'
import { cn } from '#/lib/utils'

type TrustRow = {
  id: string
  key: string
  title: string
  body_html: string
  extra: Record<string, unknown>
  sort_order: number
  is_active: boolean
}

export function AdminTrustContent() {
  const { refetch } = useCms()
  const [rows, setRows] = useState<TrustRow[]>([])
  const [draft, setDraft] = useState<TrustRow | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  const { page, setPage, totalPages, pageRows } = useAdminTablePagination(rows)
  const selectedCount = selected.size
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id))

  async function refresh() {
    const sb = getSupabase()
    if (!sb) return
    // @ts-expect-error dq_trust_blocks — run migration 20260612120000
    const { data, error } = await sb.from('dq_trust_blocks').select('*').order('sort_order')
    if (error) return setErr(error.message)
    setErr(null)
    setRows((data ?? []) as TrustRow[])
    setSelected(new Set())
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function persistRows(items: TrustRow[]) {
    const sb = getSupabase()
    if (!sb) return
    // @ts-expect-error dq_trust_blocks — run migration 20260612120000
    const { error } = await sb.from('dq_trust_blocks').upsert(items, { onConflict: 'id' })
    if (error) throw new Error(error.message)
    await refresh()
    await refetch()
  }

  function closeModal() {
    setDraft(null)
    setSaveErr(null)
  }

  async function saveModal() {
    if (!draft) return
    setBusy(true)
    setSaveErr(null)
    try {
      await persistRows([draft])
      closeModal()
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Could not save block.')
    } finally {
      setBusy(false)
    }
  }

  async function bulkSetActive(is_active: boolean) {
    const ids = [...selected]
    if (!ids.length) return
    setBusy(true)
    setErr(null)
    try {
      const payload = ids
        .map((id) => rows.find((row) => row.id === id))
        .filter((row): row is TrustRow => Boolean(row))
        .map((row) => ({ ...row, is_active }))
      await persistRows(payload)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not update trust blocks.')
    } finally {
      setBusy(false)
    }
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set())
      return
    }
    setSelected(new Set(rows.map((row) => row.id)))
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useAdminPageHeader({
    title: 'Trust content',
    description: 'Mission, 100% promise, bank details, and donation messaging.',
    actions: [],
  })

  return (
    <div>
      {err ? <p className="mb-4 text-sm text-red-400">{err}</p> : null}

      {selectedCount > 0 ? (
        <div className="admin-panel mb-4 flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="admin-muted text-sm">{selectedCount} selected</span>
          <button type="button" className="admin-btn-secondary" disabled={busy} onClick={() => void bulkSetActive(true)}>
            Activate
          </button>
          <button type="button" className="admin-btn-secondary" disabled={busy} onClick={() => void bulkSetActive(false)}>
            Deactivate
          </button>
        </div>
      ) : null}

      <div className={adminTableWrap}>
        <table className={adminTable}>
          <thead>
            <tr>
              <th className={cn(adminTh, 'w-10')}>
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all trust blocks" />
              </th>
              <th className={adminTh}>Key</th>
              <th className={adminTh}>Title</th>
              <th className={adminTh}>Order</th>
              <th className={adminTh}>Active</th>
              <th className={adminTh}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td className={cn(adminTd, 'admin-muted py-10 text-center')} colSpan={6}>
                  No trust blocks yet.
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={row.id}>
                  <td className={adminTd}>
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      aria-label={`Select ${row.title}`}
                    />
                  </td>
                  <td className={adminTd}>{row.key}</td>
                  <td className={adminTd}>{row.title}</td>
                  <td className={adminTd}>{row.sort_order}</td>
                  <td className={adminTd}>{row.is_active ? 'Yes' : 'No'}</td>
                  <td className={adminTd}>
                    <button type="button" className="admin-btn-secondary" onClick={() => setDraft(row)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <AdminTablePagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <AdminModal
        open={Boolean(draft)}
        onOpenChange={(open) => !open && closeModal()}
        title={draft?.title ?? 'Edit block'}
        wide
        footer={
          <>
            <button type="button" className="admin-btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="button" className="admin-btn-primary" disabled={busy} onClick={() => void saveModal()}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        {draft ? (
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="admin-label">Title</span>
              <input className="admin-input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} />
              Active on site
            </label>
            <RichTextEditor value={draft.body_html} onChange={(body_html) => setDraft({ ...draft, body_html })} />
            <label className="block space-y-2">
              <span className="admin-label">Extra JSON</span>
              <textarea
                className="admin-input min-h-24 font-mono text-xs"
                value={JSON.stringify(draft.extra ?? {}, null, 2)}
                onChange={(e) => {
                  try {
                    setDraft({ ...draft, extra: JSON.parse(e.target.value) as Record<string, unknown> })
                  } catch {
                    /* ignore invalid json while typing */
                  }
                }}
              />
            </label>
            {saveErr ? <p className="text-sm text-red-400">{saveErr}</p> : null}
          </div>
        ) : null}
      </AdminModal>
    </div>
  )
}
