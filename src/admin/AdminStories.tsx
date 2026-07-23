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
import { generateStoryPosterSnapshot } from '#/lib/cms/generateStoryPoster'
import {
  extractYouTubeVideoId,
  isManagedStoryPoster,
  resolveStoryPosterUrl,
} from '#/lib/media/youtube'
import { useAdminDeleteConfirm } from './useAdminDeleteConfirm'
import { cn } from '#/lib/utils'

type Row = Database['public']['Tables']['dq_story_posters']['Row']

export function AdminStories() {
  const { refetch } = useCms()
  const [rows, setRows] = useState<Row[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<Row> | null>(null)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const deleteConfirm = useAdminDeleteConfirm({ singular: 'story', plural: 'stories' })

  const { page, setPage, totalPages, pageRows } = useAdminTablePagination(rows)
  const selectedCount = selected.size
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id))

  async function refresh() {
    const sb = getSupabase()
    if (!sb) return
    const { data, error } = await sb.from('dq_story_posters').select('*').order('sort_order')
    if (error) return setErr(error.message)
    setErr(null)
    setRows(data ?? [])
    setSelected(new Set())
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function persistRows(items: Row[]) {
    const sb = getSupabase()
    if (!sb) return
    const { error } = await sb.from('dq_story_posters').upsert(items, { onConflict: 'id' })
    if (error) throw new Error(error.message)
    await refresh()
    await refetch()
  }

  async function saveModal() {
    if (!draft?.title?.trim() || !draft.video_url?.trim()) {
      setSaveErr('Title and video URL are required.')
      return
    }

    const sb = getSupabase()
    if (!sb) {
      setSaveErr('Supabase is not configured.')
      return
    }

    setBusy(true)
    setSaveErr(null)
    try {
      const {
        data: { session },
      } = await sb.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Sign in again to save stories.')
      }

      const videoUrl = draft.video_url.trim()
      const youTubeId = extractYouTubeVideoId(videoUrl)
      let imageUrl = draft.image_url?.trim() || ''

      if (youTubeId) {
        const keepCustom = Boolean(imageUrl) && !isManagedStoryPoster(imageUrl)
        if (!keepCustom) {
          const snapshot = await generateStoryPosterSnapshot({
            data: { accessToken: session.access_token, videoUrl },
          })
          imageUrl = snapshot.publicUrl
        }
      }

      if (!imageUrl) {
        throw new Error('Upload a poster image for non-YouTube videos, or use a YouTube Shorts URL.')
      }

      await persistRows([
        {
          ...draft,
          id: draft.id ?? crypto.randomUUID(),
          image_url: imageUrl,
          published: draft.published ?? true,
          is_active: draft.is_active ?? true,
          sort_order: draft.sort_order ?? rows.length + 1,
        } as Row,
      ])
      setDraft(null)
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Could not save story.')
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
      const { error } = await sb.from('dq_story_posters').delete().in('id', ids)
      if (error) throw new Error(error.message)
      deleteConfirm.cancel()
      await refresh()
      await refetch()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete stories.')
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
        .map((id) => rows.find((r) => r.id === id))
        .filter((row): row is Row => Boolean(row))
        .map((row) => ({ ...row, published }))
      await persistRows(payload)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not update stories.')
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

  const headerActions = useMemo(
    () => [{ label: 'Add story', onClick: () => setDraft({ sort_order: rows.length + 1, published: true, is_active: true }) }],
    [rows.length],
  )

  useAdminPageHeader({
    title: 'Story posters',
    description: 'Vertical short-form cards. Saving a YouTube story regenerates its snapshot poster.',
    actions: headerActions,
  })

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
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all stories" />
              </th>
              <th className={cn(adminTh, 'w-20')}>Image</th>
              <th className={adminTh}>Title</th>
              <th className={adminTh}>Sort</th>
              <th className={adminTh}>Published</th>
              <th className={adminTh}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td className={cn(adminTd, 'admin-muted py-10 text-center')} colSpan={6}>
                  No stories yet.
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
                    <button
                      type="button"
                      className="block overflow-hidden border border-[#e5e5e5] bg-[#fafafa]"
                      onClick={() => setDraft(row)}
                      title="Edit story"
                    >
                      {row.video_url || row.image_url ? (
                        <img
                          src={resolveStoryPosterUrl({ imageUrl: row.image_url, videoUrl: row.video_url })}
                          alt=""
                          className="h-12 w-12 object-cover"
                        />
                      ) : (
                        <div className="admin-muted flex h-12 w-12 items-center justify-center text-[10px]">No image</div>
                      )}
                    </button>
                  </td>
                  <td className={adminTd}>{row.title}</td>
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
        open={!!draft}
        onOpenChange={(open) => !open && setDraft(null)}
        title={draft?.id && rows.some((r) => r.id === draft.id) ? 'Edit story' : 'Add story'}
        footer={
          <>
            <button type="button" className="admin-btn-secondary" onClick={() => setDraft(null)}>
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
              <input className="admin-input" value={draft.title ?? ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </label>
            <label className="block space-y-2">
              <span className="admin-label">YouTube Shorts / video URL</span>
              <input
                className="admin-input"
                value={draft.video_url ?? ''}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    video_url: e.target.value,
                    image_url: isManagedStoryPoster(draft.image_url) ? '' : draft.image_url,
                  })
                }
                placeholder="https://youtube.com/shorts/..."
              />
              <span className="admin-muted text-xs">
                On save, a fresh YouTube snapshot is downloaded into storage and used as the circle poster.
              </span>
            </label>
            <ImageUploadField
              label="Custom poster (optional)"
              folder="story-posters"
              value={draft.image_url ?? ''}
              onChange={(v) => setDraft({ ...draft, image_url: v })}
            />
            <span className="admin-muted block text-xs">
              Leave empty for YouTube — a snapshot is regenerated every time you save. Upload only to override.
            </span>
            <label className="block space-y-2">
              <span className="admin-label">Link URL</span>
              <input className="admin-input" value={draft.link_url ?? ''} onChange={(e) => setDraft({ ...draft, link_url: e.target.value })} />
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
              <input type="checkbox" checked={draft.published ?? true} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />
              Published
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
