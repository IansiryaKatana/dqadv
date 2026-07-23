import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '#/integrations/supabase/client'
import { useCms } from '#/contexts/CmsContext'
import { useAdminPageHeader } from './AdminPageContext'
import { AdminModal } from './components/AdminModal'
import { AdminDeleteConfirmDialog } from './components/AdminDeleteConfirmDialog'
import { AdminTableImageCell } from './components/AdminTableImageCell'
import { AdminTablePagination } from './components/AdminTablePagination'
import { ImageUploadField } from './components/ImageUploadField'
import { MediaUploadField } from './components/MediaUploadField'
import { useAdminTablePagination } from './useAdminTablePagination'
import { resolveSlugFromLabel } from '#/lib/slug'
import { adminTable, adminTableWrap, adminTd, adminTh } from './adminClassNames'
import { useAdminDeleteConfirm } from './useAdminDeleteConfirm'
import { cn } from '#/lib/utils'

type Row = {
  id: string
  slug: string
  language: string
  featured_image_url: string
  pdf_url: string | null
  sort_order: number
  is_active: boolean
  published: boolean
}

const empty = (): Row => ({
  id: crypto.randomUUID(),
  slug: '',
  language: '',
  featured_image_url: '',
  pdf_url: null,
  sort_order: 0,
  is_active: true,
  published: true,
})

export function AdminQuranEditions() {
  const { refetch } = useCms()
  const [rows, setRows] = useState<Row[]>([])
  const [draft, setDraft] = useState<Row | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const deleteConfirm = useAdminDeleteConfirm({ singular: 'edition', plural: 'editions' })

  const { page, setPage, totalPages, pageRows } = useAdminTablePagination(rows)
  const selectedCount = selected.size
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id))

  async function refresh() {
    const sb = getSupabase()
    if (!sb) return
    // @ts-expect-error dq_quran_editions — run migration 20260612130000
    const { data, error } = await sb.from('dq_quran_editions').select('*').order('sort_order')
    if (error) return setErr(error.message)
    setErr(null)
    setRows((data ?? []) as Row[])
    setSelected(new Set())
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function persistRows(items: Row[]) {
    const sb = getSupabase()
    if (!sb) return
    const payload = items.map((item) => ({ ...item, audio_url: null }))
    // @ts-expect-error dq_quran_editions — run migration 20260612130000
    const { error } = await sb.from('dq_quran_editions').upsert(payload, { onConflict: 'id' })
    if (error) throw new Error(error.message)
    await refresh()
    await refetch()
  }

  function closeModal() {
    setDraft(null)
    setSaveErr(null)
  }

  async function saveModal() {
    if (!draft?.language || !draft.featured_image_url) {
      setSaveErr('Language and featured image are required.')
      return
    }
    setBusy(true)
    setSaveErr(null)
    try {
      const existing = rows.find((row) => row.id === draft.id)
      await persistRows([
        {
          ...draft,
          slug: resolveSlugFromLabel(draft.language, existing?.language, existing?.slug),
        },
      ])
      closeModal()
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Could not save edition.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(ids: string[]) {
    if (!ids.length) return
    const sb = getSupabase()
    if (!sb) return
    setBusy(true)
    setErr(null)
    try {
      // @ts-expect-error dq_quran_editions — run migration 20260612130000
      const { error } = await sb.from('dq_quran_editions').delete().in('id', ids)
      if (error) throw new Error(error.message)
      deleteConfirm.cancel()
      await refresh()
      await refetch()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete editions.')
    } finally {
      setBusy(false)
    }
  }

  async function bulkSetPublished(published: boolean) {
    const ids = [...selected]
    if (!ids.length) return
    setBusy(true)
    setErr(null)
    try {
      const payload = ids
        .map((id) => rows.find((row) => row.id === id))
        .filter((row): row is Row => Boolean(row))
        .map((row) => ({ ...row, published }))
      await persistRows(payload)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not update editions.')
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
    title: "Qur'an editions",
    description: 'Multilingual PDF downloads.',
    actions: useMemo(() => [{ label: 'Add edition', onClick: () => setDraft(empty()) }], []),
  })

  const isEditing = Boolean(draft?.id && rows.some((row) => row.id === draft.id))

  return (
    <div>
      {err ? <p className="mb-4 text-sm text-red-400">{err}</p> : null}

      {selectedCount > 0 ? (
        <div className="admin-panel mb-4 flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="admin-muted text-sm">{selectedCount} selected</span>
          <button type="button" className="admin-btn-secondary" disabled={busy} onClick={() => void bulkSetPublished(true)}>
            Publish
          </button>
          <button type="button" className="admin-btn-secondary" disabled={busy} onClick={() => void bulkSetPublished(false)}>
            Unpublish
          </button>
          <button type="button" className="admin-btn-danger" disabled={busy} onClick={() => deleteConfirm.request([...selected])}>
            Delete selected
          </button>
        </div>
      ) : null}

      <div className={adminTableWrap}>
        <table className={adminTable}>
          <thead>
            <tr>
              <th className={cn(adminTh, 'w-10')}>
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all editions" />
              </th>
              <th className={cn(adminTh, 'w-20')}>Image</th>
              <th className={adminTh}>Language</th>
              <th className={adminTh}>PDF</th>
              <th className={adminTh}>Order</th>
              <th className={adminTh}>Published</th>
              <th className={adminTh}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td className={cn(adminTd, 'admin-muted py-10 text-center')} colSpan={7}>
                  No editions yet.
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
                      aria-label={`Select ${row.language}`}
                    />
                  </td>
                  <td className={adminTd}>
                    <AdminTableImageCell src={row.featured_image_url} label="Edit edition" onClick={() => setDraft(row)} />
                  </td>
                  <td className={adminTd}>{row.language}</td>
                  <td className={adminTd}>{row.pdf_url ? 'Yes' : '—'}</td>
                  <td className={adminTd}>{row.sort_order}</td>
                  <td className={adminTd}>{row.published ? 'Yes' : 'No'}</td>
                  <td className={adminTd}>
                    <div className="flex gap-2">
                      <button type="button" className="admin-btn-secondary" onClick={() => setDraft(row)}>
                        Edit
                      </button>
                      <button type="button" className="admin-btn-danger" onClick={() => deleteConfirm.request([row.id])}>
                        Delete
                      </button>
                    </div>
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
        title={isEditing ? "Edit Qur'an edition" : "Add Qur'an edition"}
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="admin-label">Language</span>
              <input className="admin-input" value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value })} />
            </label>
            <label className="block space-y-2">
              <span className="admin-label">Sort order</span>
              <input className="admin-input" type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
            </label>
            <ImageUploadField label="Featured image" folder="quran-editions" value={draft.featured_image_url} onChange={(v) => setDraft({ ...draft, featured_image_url: v })} />
            <MediaUploadField label="PDF URL" folder="quran-editions/pdf" value={draft.pdf_url ?? ''} onChange={(v) => setDraft({ ...draft, pdf_url: v || null })} accept="application/pdf" />
            <div className="flex flex-col gap-3 md:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />
                Published
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} />
                Active
              </label>
            </div>
            {saveErr ? <p className="text-sm text-red-400 md:col-span-2">{saveErr}</p> : null}
          </div>
        ) : null}
      </AdminModal>
      <AdminDeleteConfirmDialog
        open={deleteConfirm.open}
        description={deleteConfirm.description}
        busy={busy}
        onCancel={deleteConfirm.cancel}
        onConfirm={() => void remove(deleteConfirm.pendingIds)}
      />
    </div>
  )
}
