import { useEffect, useMemo, useState } from 'react'
import type { Database } from '#/integrations/supabase/database.types'
import { getSupabase } from '#/integrations/supabase/client'
import { useCms } from '#/contexts/CmsContext'
import { useAdminPageHeader } from './AdminPageContext'
import { AdminModal } from './components/AdminModal'
import { AdminDeleteConfirmDialog } from './components/AdminDeleteConfirmDialog'
import { ImageUploadField } from './components/ImageUploadField'
import { RichTextEditor } from './components/RichTextEditor'
import { AdminTablePagination } from './components/AdminTablePagination'
import { useAdminTablePagination } from './useAdminTablePagination'
import { adminTable, adminTableWrap, adminTd, adminTh } from './adminClassNames'
import { AdminSelect } from './components/AdminSelect'
import { ADMIN_STATUS_OPTIONS } from './adminSelectOptions'
import { resolveSlugFromLabel } from '#/lib/slug'
import { useAdminDeleteConfirm } from './useAdminDeleteConfirm'
import { cn } from '#/lib/utils'

type ArticleRow = Database['public']['Tables']['dq_quran_wiki_articles']['Row']
type BannerRow = Database['public']['Tables']['dq_quran_wiki_banner']['Row']

export function AdminQuranWiki() {
  const { refetch } = useCms()
  const [rows, setRows] = useState<ArticleRow[]>([])
  const [banner, setBanner] = useState<BannerRow | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<ArticleRow> | null>(null)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const deleteConfirm = useAdminDeleteConfirm({ singular: 'wiki article', plural: 'wiki articles' })

  const { page, setPage, totalPages, pageRows } = useAdminTablePagination(rows)
  const selectedCount = selected.size
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id))

  async function refresh() {
    const sb = getSupabase()
    if (!sb) return
    const [articlesRes, bannerRes] = await Promise.all([
      sb.from('dq_quran_wiki_articles').select('*').order('published_at', { ascending: false }),
      sb.from('dq_quran_wiki_banner').select('*').limit(1).maybeSingle(),
    ])
    if (articlesRes.error) return setErr(articlesRes.error.message)
    setErr(null)
    setRows(articlesRes.data ?? [])
    setBanner(bannerRes.data)
    setSelected(new Set())
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function persistRows(items: ArticleRow[]) {
    const sb = getSupabase()
    if (!sb) return
    const { error } = await sb.from('dq_quran_wiki_articles').upsert(items, { onConflict: 'id' })
    if (error) throw new Error(error.message)
    await refresh()
    await refetch()
  }

  async function saveBanner() {
    if (!banner?.title || !banner.image_url || !banner.link_url) {
      setErr('Banner title, image, and link URL are required.')
      return
    }
    const sb = getSupabase()
    if (!sb) return
    setBusy(true)
    setErr(null)
    try {
      const { error } = await sb.from('dq_quran_wiki_banner').upsert({
        ...banner,
        id: banner.id ?? crypto.randomUUID(),
        is_active: banner.is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      if (error) throw new Error(error.message)
      await refresh()
      await refetch()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save banner.')
    } finally {
      setBusy(false)
    }
  }

  async function saveModal() {
    if (!draft?.title) {
      setSaveErr('Title is required.')
      return
    }
    setBusy(true)
    setSaveErr(null)
    try {
      const existing = rows.find((row) => row.id === draft.id)
      const row = {
        ...draft,
        id: draft.id ?? crypto.randomUUID(),
        slug: resolveSlugFromLabel(draft.title, existing?.title, existing?.slug),
        status: draft.status ?? 'draft',
        category: draft.category ?? 'Wiki',
        excerpt: draft.excerpt ?? '',
        cover_image_url: draft.cover_image_url ?? '',
        published_at: draft.status === 'published' ? draft.published_at ?? new Date().toISOString() : draft.published_at,
      } as ArticleRow
      await persistRows([row])
      setDraft(null)
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Could not save wiki article.')
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
      const { error } = await sb.from('dq_quran_wiki_articles').delete().in('id', ids)
      if (error) throw new Error(error.message)
      deleteConfirm.cancel()
      await refresh()
      await refetch()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete wiki articles.')
    } finally {
      setBusy(false)
    }
  }

  async function bulkSetStatus(status: 'published' | 'draft') {
    const ids = [...selected]
    if (!ids.length) return
    setBusy(true)
    setErr(null)
    try {
      const payload = ids
        .map((id) => rows.find((r) => r.id === id))
        .filter((row): row is ArticleRow => Boolean(row))
        .map((row) => ({
          ...row,
          status,
          published_at: status === 'published' ? row.published_at ?? new Date().toISOString() : row.published_at,
        }))
      await persistRows(payload)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not update wiki articles.')
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
    () => [{ label: 'Add wiki article', onClick: () => setDraft({ status: 'draft', category: 'Wiki' }) }],
    [],
  )

  useAdminPageHeader({
    title: "Qur'an Wiki",
    description: 'Homepage banner and wiki articles for quranwiki.org content.',
    actions: headerActions,
  })

  return (
    <div>
      {err ? <p className="mb-4 text-sm text-red-400">{err}</p> : null}

      {banner ? (
        <div className="admin-panel mb-6 space-y-4 p-4">
          <h2 className="font-semibold">Homepage banner</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="admin-label">Title</span>
              <input className="admin-input" value={banner.title} onChange={(e) => setBanner({ ...banner, title: e.target.value })} />
            </label>
            <label className="block space-y-2">
              <span className="admin-label">Subtitle</span>
              <input className="admin-input" value={banner.subtitle} onChange={(e) => setBanner({ ...banner, subtitle: e.target.value })} />
            </label>
            <ImageUploadField
              label="Banner image"
              folder="quran-wiki"
              value={banner.image_url}
              onChange={(v) => setBanner({ ...banner, image_url: v })}
            />
            <label className="block space-y-2">
              <span className="admin-label">Link URL</span>
              <input className="admin-input" value={banner.link_url} onChange={(e) => setBanner({ ...banner, link_url: e.target.value })} />
            </label>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input type="checkbox" checked={banner.is_active} onChange={(e) => setBanner({ ...banner, is_active: e.target.checked })} />
              Active on homepage
            </label>
          </div>
          <button type="button" className="admin-btn-primary" disabled={busy} onClick={() => void saveBanner()}>
            {busy ? 'Saving…' : 'Save banner'}
          </button>
        </div>
      ) : null}

      {selectedCount > 0 ? (
        <div className="admin-panel mb-4 flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="admin-muted text-sm">{selectedCount} selected</span>
          <button type="button" className="admin-btn-secondary" disabled={busy} onClick={() => void bulkSetStatus('published')}>
            Publish
          </button>
          <button type="button" className="admin-btn-secondary" disabled={busy} onClick={() => void bulkSetStatus('draft')}>
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
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all wiki articles" />
              </th>
              <th className={cn(adminTh, 'w-20')}>Image</th>
              <th className={adminTh}>Title</th>
              <th className={adminTh}>Status</th>
              <th className={adminTh}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td className={cn(adminTd, 'admin-muted py-10 text-center')} colSpan={5}>
                  No wiki articles yet.
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
                      title="Edit wiki article"
                    >
                      {row.cover_image_url ? (
                        <img src={row.cover_image_url} alt="" className="h-12 w-12 object-cover" />
                      ) : (
                        <div className="admin-muted flex h-12 w-12 items-center justify-center text-[10px]">No image</div>
                      )}
                    </button>
                  </td>
                  <td className={adminTd}>{row.title}</td>
                  <td className={adminTd}>{row.status}</td>
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
        title={draft?.id && rows.some((r) => r.id === draft.id) ? 'Edit wiki article' : 'Add wiki article'}
        wide
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
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2 md:col-span-2">
              <span className="admin-label">Title</span>
              <input className="admin-input" value={draft.title ?? ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </label>
            <label className="block space-y-2 md:col-span-2">
              <span className="admin-label">Excerpt</span>
              <textarea className="admin-input min-h-20" value={draft.excerpt ?? ''} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} />
            </label>
            <ImageUploadField
              label="Cover image"
              folder="quran-wiki"
              value={draft.cover_image_url ?? ''}
              onChange={(v) => setDraft({ ...draft, cover_image_url: v })}
            />
            <label className="block space-y-2">
              <span className="admin-label">Status</span>
              <AdminSelect
                value={draft.status ?? 'draft'}
                onValueChange={(status) => setDraft({ ...draft, status })}
                options={ADMIN_STATUS_OPTIONS}
              />
            </label>
            <label className="block space-y-2">
              <span className="admin-label">Read time</span>
              <input className="admin-input" value={draft.read_time ?? ''} onChange={(e) => setDraft({ ...draft, read_time: e.target.value })} placeholder="5 min read" />
            </label>
            <RichTextEditor
              key={draft.id ?? 'new-wiki-article'}
              className="md:col-span-2"
              label="Body"
              value={draft.body_html ?? ''}
              onChange={(html) => setDraft({ ...draft, body_html: html })}
              placeholder="Write the full wiki article content…"
            />
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
