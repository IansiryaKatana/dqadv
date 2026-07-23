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
import { AdminSelect } from './components/AdminSelect'
import { ADMIN_VIDEO_TYPE_OPTIONS } from './adminSelectOptions'
import { useAdminDeleteConfirm } from './useAdminDeleteConfirm'
import { cn } from '#/lib/utils'

type Row = {
  id: string
  slug: string
  title: string
  description: string
  thumbnail_url: string
  video_type: 'upload' | 'youtube'
  video_url: string
  duration: string | null
  sort_order: number
  is_active: boolean
  published: boolean
}

export function AdminVideos() {
  const { refetch } = useCms()
  const [rows, setRows] = useState<Row[]>([])
  const [draft, setDraft] = useState<Partial<Row> | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const deleteConfirm = useAdminDeleteConfirm({ singular: 'video', plural: 'videos' })

  const { page, setPage, totalPages, pageRows } = useAdminTablePagination(rows)
  const selectedCount = selected.size
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id))

  async function refresh() {
    const sb = getSupabase()
    if (!sb) return
    // @ts-expect-error dq_featured_videos — run migration 20260612140000
    const { data, error } = await sb.from('dq_featured_videos').select('*').order('sort_order')
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
    // @ts-expect-error dq_featured_videos — run migration 20260612140000
    const { error } = await sb.from('dq_featured_videos').upsert(items, { onConflict: 'id' })
    if (error) throw new Error(error.message)
    await refresh()
    await refetch()
  }

  function closeModal() {
    setDraft(null)
    setSaveErr(null)
  }

  async function saveModal() {
    if (!draft?.title || !draft.video_url) {
      setSaveErr('Title and video URL are required.')
      return
    }
    setBusy(true)
    setSaveErr(null)
    try {
      const existing = rows.find((row) => row.id === draft.id)
      await persistRows([
        {
          ...draft,
          id: draft.id ?? crypto.randomUUID(),
          slug: resolveSlugFromLabel(draft.title, existing?.title, existing?.slug),
          video_type: draft.video_type ?? 'youtube',
          thumbnail_url: draft.thumbnail_url ?? '',
          description: draft.description ?? '',
          sort_order: draft.sort_order ?? 0,
          is_active: draft.is_active ?? true,
          published: draft.published ?? true,
        } as Row,
      ])
      closeModal()
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Could not save video.')
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
      // @ts-expect-error dq_featured_videos — run migration 20260612140000
      const { error } = await sb.from('dq_featured_videos').delete().in('id', ids)
      if (error) throw new Error(error.message)
      deleteConfirm.cancel()
      await refresh()
      await refetch()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete videos.')
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
      setErr(e instanceof Error ? e.message : 'Could not update videos.')
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
    title: 'Featured videos',
    description: 'Campaign and educational videos.',
    actions: useMemo(
      () => [{ label: 'Add video', onClick: () => setDraft({ id: crypto.randomUUID(), video_type: 'youtube', published: true, is_active: true }) }],
      [],
    ),
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
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all videos" />
              </th>
              <th className={cn(adminTh, 'w-20')}>Image</th>
              <th className={adminTh}>Title</th>
              <th className={adminTh}>Type</th>
              <th className={adminTh}>Order</th>
              <th className={adminTh}>Published</th>
              <th className={adminTh}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td className={cn(adminTd, 'admin-muted py-10 text-center')} colSpan={7}>
                  No videos yet.
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
                  <td className={adminTd}>
                    <AdminTableImageCell src={row.thumbnail_url} label="Edit video" onClick={() => setDraft(row)} />
                  </td>
                  <td className={adminTd}>{row.title}</td>
                  <td className={adminTd}>{row.video_type}</td>
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
        title={isEditing ? 'Edit video' : 'Add video'}
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
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2 md:col-span-2">
              <span className="admin-label">Title</span>
              <input className="admin-input" value={draft.title ?? ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </label>
            <label className="block space-y-2 md:col-span-2">
              <span className="admin-label">Description</span>
              <textarea className="admin-input min-h-20" value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </label>
            <label className="block space-y-2">
              <span className="admin-label">Video type</span>
              <AdminSelect
                value={draft.video_type ?? 'youtube'}
                onValueChange={(video_type) => setDraft({ ...draft, video_type: video_type as 'upload' | 'youtube' })}
                options={ADMIN_VIDEO_TYPE_OPTIONS}
              />
            </label>
            <label className="block space-y-2">
              <span className="admin-label">Duration</span>
              <input className="admin-input" placeholder="3:42" value={draft.duration ?? ''} onChange={(e) => setDraft({ ...draft, duration: e.target.value })} />
            </label>
            <MediaUploadField label="Video URL" folder="videos" value={draft.video_url ?? ''} onChange={(v) => setDraft({ ...draft, video_url: v })} accept="video/*" />
            <ImageUploadField label="Thumbnail" folder="videos" value={draft.thumbnail_url ?? ''} onChange={(v) => setDraft({ ...draft, thumbnail_url: v })} />
            <label className="block space-y-2">
              <span className="admin-label">Sort order</span>
              <input className="admin-input" type="number" value={draft.sort_order ?? 0} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
            </label>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.published ?? true} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />
                Published
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.is_active ?? true} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} />
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
