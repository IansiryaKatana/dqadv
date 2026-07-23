import { useEffect, useMemo, useState } from 'react'
import type { Database } from '#/integrations/supabase/database.types'
import { getSupabase } from '#/integrations/supabase/client'
import { useCms } from '#/contexts/CmsContext'
import { useAdminPageHeader } from './AdminPageContext'
import { AdminModal } from './components/AdminModal'
import { AdminDeleteConfirmDialog } from './components/AdminDeleteConfirmDialog'
import { ImageUploadField } from './components/ImageUploadField'
import { AdminTablePagination } from './components/AdminTablePagination'
import { useAdminTablePagination } from './useAdminTablePagination'
import { adminTable, adminTableWrap, adminTd, adminTh } from './adminClassNames'
import { useAdminDeleteConfirm } from './useAdminDeleteConfirm'
import { cn } from '#/lib/utils'

type ImageRow = Database['public']['Tables']['dq_venture_images']['Row']
type SectionRow = Database['public']['Tables']['dq_venture_section']['Row']

export function AdminVenture() {
  const { refetch } = useCms()
  const [images, setImages] = useState<ImageRow[]>([])
  const [section, setSection] = useState<SectionRow | null>(null)
  const [draft, setDraft] = useState<Partial<ImageRow> | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const deleteConfirm = useAdminDeleteConfirm({ singular: 'image', plural: 'images' })

  const { page, setPage, totalPages, pageRows } = useAdminTablePagination(images)
  const selectedCount = selected.size
  const allSelected = images.length > 0 && images.every((row) => selected.has(row.id))

  async function refresh() {
    const sb = getSupabase()
    if (!sb) return
    const [imgRes, secRes] = await Promise.all([
      sb.from('dq_venture_images').select('*').order('sort_order'),
      sb.from('dq_venture_section').select('*').limit(1).maybeSingle(),
    ])
    if (imgRes.error) setErr(imgRes.error.message)
    else setErr(null)
    setImages(imgRes.data ?? [])
    setSection(secRes.data)
    setSelected(new Set())
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function persistImages(items: ImageRow[]) {
    const sb = getSupabase()
    if (!sb) return
    const { error } = await sb.from('dq_venture_images').upsert(items, { onConflict: 'id' })
    if (error) throw new Error(error.message)
    await refresh()
    await refetch()
  }

  async function saveImage() {
    if (!draft?.image_url || !draft.alt) {
      setSaveErr('Image and alt text are required.')
      return
    }
    setBusy(true)
    setSaveErr(null)
    try {
      await persistImages([
        {
          ...draft,
          id: draft.id ?? crypto.randomUUID(),
          is_active: draft.is_active ?? true,
          sort_order: draft.sort_order ?? images.length + 1,
        } as ImageRow,
      ])
      setDraft(null)
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Could not save venture image.')
    } finally {
      setBusy(false)
    }
  }

  async function saveSection() {
    if (!section) return
    const sb = getSupabase()
    if (!sb) return
    await sb.from('dq_venture_section').upsert(section)
    await refresh()
    await refetch()
  }

  async function remove(ids: string[]) {
    if (!ids.length) return
    const sb = getSupabase()
    if (!sb) return
    setBusy(true)
    setErr(null)
    try {
      const { error } = await sb.from('dq_venture_images').delete().in('id', ids)
      if (error) throw new Error(error.message)
      deleteConfirm.cancel()
      await refresh()
      await refetch()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete images.')
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
        .map((id) => images.find((r) => r.id === id))
        .filter((row): row is ImageRow => Boolean(row))
        .map((row) => ({ ...row, is_active }))
      await persistImages(payload)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not update images.')
    } finally {
      setBusy(false)
    }
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set())
      return
    }
    setSelected(new Set(images.map((row) => row.id)))
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const headerActions = useMemo(
    () => [{ label: 'Add image', onClick: () => setDraft({ sort_order: images.length + 1, is_active: true }) }],
    [images.length],
  )

  useAdminPageHeader({
    title: 'Greatest Venture',
    description: 'Proof section copy and distribution gallery.',
    actions: headerActions,
  })

  return (
    <div>
      {err ? <p className="mb-4 text-sm text-red-400">{err}</p> : null}

      {section ? (
        <div className="admin-panel mb-6 space-y-4 p-4">
          <h2 className="font-semibold">Section copy</h2>
          <textarea className="admin-input min-h-24" value={section.description} onChange={(e) => setSection({ ...section, description: e.target.value })} />
          <button type="button" className="admin-btn-primary" onClick={() => void saveSection()}>
            Save section
          </button>
        </div>
      ) : null}

      {selectedCount > 0 ? (
        <div className="admin-panel mb-4 flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="admin-muted text-sm">{selectedCount} selected</span>
          <button type="button" className="admin-btn-secondary" disabled={busy} onClick={() => void bulkSetActive(true)}>
            Activate
          </button>
          <button type="button" className="admin-btn-secondary" disabled={busy} onClick={() => void bulkSetActive(false)}>
            Deactivate
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
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all venture images" />
              </th>
              <th className={cn(adminTh, 'w-20')}>Image</th>
              <th className={adminTh}>Alt</th>
              <th className={adminTh}>Sort</th>
              <th className={adminTh}>Active</th>
              <th className={adminTh}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td className={cn(adminTd, 'admin-muted py-10 text-center')} colSpan={6}>
                  No venture images yet.
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
                      aria-label={`Select ${row.alt}`}
                    />
                  </td>
                  <td className={adminTd}>
                    <button
                      type="button"
                      className="block overflow-hidden border border-[#e5e5e5] bg-[#fafafa]"
                      onClick={() => setDraft(row)}
                      title="Edit venture image"
                    >
                      {row.image_url ? (
                        <img src={row.image_url} alt="" className="h-12 w-12 object-cover" />
                      ) : (
                        <div className="admin-muted flex h-12 w-12 items-center justify-center text-[10px]">No image</div>
                      )}
                    </button>
                  </td>
                  <td className={adminTd}>{row.alt}</td>
                  <td className={adminTd}>{row.sort_order}</td>
                  <td className={adminTd}>{row.is_active ? 'Yes' : 'No'}</td>
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
        open={!!draft}
        onOpenChange={(open) => !open && setDraft(null)}
        title={draft?.id && images.some((r) => r.id === draft.id) ? 'Edit venture image' : 'Add venture image'}
        footer={
          <>
            <button type="button" className="admin-btn-secondary" onClick={() => setDraft(null)}>
              Cancel
            </button>
            <button type="button" className="admin-btn-primary" disabled={busy} onClick={() => void saveImage()}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        {draft ? (
          <div className="space-y-4">
            <ImageUploadField
              label="Venture image"
              folder="venture-images"
              value={draft.image_url ?? ''}
              onChange={(v) => setDraft({ ...draft, image_url: v })}
            />
            <label className="block space-y-2">
              <span className="admin-label">Alt text</span>
              <input className="admin-input" value={draft.alt ?? ''} onChange={(e) => setDraft({ ...draft, alt: e.target.value })} />
            </label>
            <label className="block space-y-2">
              <span className="admin-label">Sort order</span>
              <input
                className="admin-input"
                type="number"
                value={draft.sort_order ?? 0}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.is_active ?? true} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} />
              Active
            </label>
            {saveErr ? <p className="text-sm text-red-400">{saveErr}</p> : null}
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
