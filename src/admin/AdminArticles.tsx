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
import { adminFilters, adminTable, adminTableWrap, adminTd, adminTh } from './adminClassNames'
import { AdminSelect } from './components/AdminSelect'
import { ADMIN_STATUS_OPTIONS } from './adminSelectOptions'
import { resolveSlugFromLabel } from '#/lib/slug'
import { useAdminDeleteConfirm } from './useAdminDeleteConfirm'
import { cn } from '#/lib/utils'

type Row = Database['public']['Tables']['dq_articles']['Row']

export function AdminArticles() {
  const { refetch } = useCms()
  const [rows, setRows] = useState<Row[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<Row> | null>(null)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')
  const deleteConfirm = useAdminDeleteConfirm({ singular: 'article', plural: 'articles' })

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (!q) return true
      const haystack = `${row.title} ${row.slug} ${row.category} ${row.excerpt}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [rows, search, statusFilter])

  const { page, setPage, totalPages, pageRows } = useAdminTablePagination(filteredRows)
  const selectedCount = selected.size
  const allSelected = filteredRows.length > 0 && filteredRows.every((row) => selected.has(row.id))

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, setPage])

  async function refresh() {
    const sb = getSupabase()
    if (!sb) return
    const { data, error } = await sb.from('dq_articles').select('*').order('published_at', { ascending: false })
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
    const { error } = await sb.from('dq_articles').upsert(items, { onConflict: 'id' })
    if (error) throw new Error(error.message)
    await refresh()
    await refetch()
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
        category: draft.category ?? 'Blog',
        excerpt: draft.excerpt ?? '',
        cover_image_url: draft.cover_image_url ?? '',
        published_at: draft.status === 'published' ? draft.published_at ?? new Date().toISOString() : draft.published_at,
      } as Row
      await persistRows([row])
      setDraft(null)
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Could not save article.')
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
      const { error } = await sb.from('dq_articles').delete().in('id', ids)
      if (error) throw new Error(error.message)
      deleteConfirm.cancel()
      await refresh()
      await refetch()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete articles.')
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
        .filter((row): row is Row => Boolean(row))
        .map((row) => ({
          ...row,
          status,
          published_at: status === 'published' ? row.published_at ?? new Date().toISOString() : row.published_at,
        }))
      await persistRows(payload)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not update articles.')
    } finally {
      setBusy(false)
    }
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set())
      return
    }
    setSelected(new Set(filteredRows.map((row) => row.id)))
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
    () => [{ label: 'Add article', onClick: () => setDraft({ status: 'draft', category: 'Blog' }) }],
    [],
  )

  useAdminPageHeader({
    title: 'Blog articles',
    description: 'Published posts appear on the homepage blog section.',
    actions: headerActions,
  })

  return (
    <div>
      {err ? <p className="mb-4 text-sm text-red-400">{err}</p> : null}

      <div className={adminFilters}>
        <input
          className="admin-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, slug, category…"
          aria-label="Search articles"
        />
        <AdminSelect
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as 'all' | 'draft' | 'published')}
          options={[
            { value: 'all', label: 'All statuses' },
            ...ADMIN_STATUS_OPTIONS,
          ]}
          placeholder="Status"
        />
      </div>

      {selectedCount > 0 ? (
        <div className="admin-panel mb-4 flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="admin-muted text-sm">{selectedCount} selected</span>
          <button type="button" className="admin-btn-secondary" disabled={busy} onClick={() => void bulkSetStatus('published')}>
            Publish
          </button>
          <button type="button" className="admin-btn-secondary" disabled={busy} onClick={() => void bulkSetStatus('draft')}>
            Move to draft
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
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all articles" />
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
                  {rows.length === 0 ? 'No articles yet.' : 'No articles match your filters.'}
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
                      title="Edit article"
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
        title={draft?.id && rows.some((r) => r.id === draft.id) ? 'Edit article' : 'Add article'}
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
              folder="articles"
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
              key={draft.id ?? 'new-article'}
              className="md:col-span-2"
              label="Body"
              value={draft.body_html ?? ''}
              onChange={(html) => setDraft({ ...draft, body_html: html })}
              placeholder="Write the full article content…"
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
