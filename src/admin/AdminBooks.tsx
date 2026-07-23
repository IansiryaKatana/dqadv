import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '#/integrations/supabase/client'
import { useCms } from '#/contexts/CmsContext'
import { useAdminPageHeader } from './AdminPageContext'
import { AdminModal } from './components/AdminModal'
import { AdminDeleteConfirmDialog } from './components/AdminDeleteConfirmDialog'
import { AdminTableImageCell } from './components/AdminTableImageCell'
import { AdminTablePagination } from './components/AdminTablePagination'
import { ImageUploadField } from './components/ImageUploadField'
import { RichTextEditor } from './components/RichTextEditor'
import { useAdminTablePagination } from './useAdminTablePagination'
import { resolveSlugFromLabel } from '#/lib/slug'
import { adminTable, adminTableWrap, adminTd, adminTh } from './adminClassNames'
import { AdminSelect } from './components/AdminSelect'
import { ADMIN_STATUS_OPTIONS } from './adminSelectOptions'
import { useAdminDeleteConfirm } from './useAdminDeleteConfirm'
import { Badge } from '#/components/ui/badge'
import { Input } from '#/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { cn } from '#/lib/utils'

type Row = {
  id: string
  slug: string
  title: string
  excerpt: string
  cover_image_url: string
  card_cover_image_url: string
  category: string
  body_html: string
  read_time: string | null
  status: string
  published_at: string | null
  sort_order: number
}

type StatusFilter = 'all' | 'draft' | 'published'

function matchesStatus(row: Row, status: StatusFilter) {
  if (status === 'all') return true
  return row.status === status
}

export function AdminBooks() {
  const { refetch } = useCms()
  const [rows, setRows] = useState<Row[]>([])
  const [draft, setDraft] = useState<Partial<Row> | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const deleteConfirm = useAdminDeleteConfirm({ singular: 'book', plural: 'books' })

  const statusCounts = useMemo(() => {
    let draft = 0
    let published = 0
    for (const row of rows) {
      if (row.status === 'draft') draft += 1
      else if (row.status === 'published') published += 1
    }
    return { all: rows.length, draft, published }
  }, [rows])

  const categories = useMemo(() => {
    return [...new Set(rows.map((row) => row.category).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  }, [rows])

  const categoryCounts = useMemo(() => {
    const scoped = rows.filter((row) => matchesStatus(row, statusFilter))
    const counts: Record<string, number> = { all: scoped.length }
    for (const row of scoped) {
      if (!row.category) continue
      counts[row.category] = (counts[row.category] ?? 0) + 1
    }
    return counts
  }, [rows, statusFilter])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (!matchesStatus(row, statusFilter)) return false
      if (categoryFilter !== 'all' && row.category !== categoryFilter) return false
      if (!q) return true
      const haystack = `${row.title} ${row.slug} ${row.category} ${row.excerpt}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [rows, search, statusFilter, categoryFilter])

  const { page, setPage, totalPages, pageRows } = useAdminTablePagination(filteredRows)
  const selectedCount = selected.size
  const allSelected = filteredRows.length > 0 && filteredRows.every((row) => selected.has(row.id))

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, categoryFilter, setPage])

  useEffect(() => {
    if (categoryFilter === 'all') return
    if ((categoryCounts[categoryFilter] ?? 0) === 0) {
      setCategoryFilter('all')
    }
  }, [categoryFilter, categoryCounts])

  async function refresh() {
    const sb = getSupabase()
    if (!sb) return
    const { data, error } = await sb.from('dq_books').select('*').order('sort_order')
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
    // @ts-expect-error dq_books — run migration 20260612140000
    const { error } = await sb.from('dq_books').upsert(items, { onConflict: 'id' })
    if (error) throw new Error(error.message)
    await refresh()
    await refetch()
  }

  function closeModal() {
    setDraft(null)
    setSaveErr(null)
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
      await persistRows([
        {
          ...draft,
          id: draft.id ?? crypto.randomUUID(),
          slug: resolveSlugFromLabel(draft.title, existing?.title, existing?.slug),
          status: draft.status ?? 'draft',
          category: draft.category ?? 'Surah',
          excerpt: draft.excerpt ?? '',
          cover_image_url: draft.cover_image_url ?? '',
          card_cover_image_url: draft.card_cover_image_url ?? '',
          body_html: draft.body_html ?? '',
          sort_order: draft.sort_order ?? 0,
          published_at: draft.status === 'published' ? draft.published_at ?? new Date().toISOString() : draft.published_at,
        } as Row,
      ])
      closeModal()
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Could not save book.')
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
      const { error } = await sb.from('dq_books').delete().in('id', ids)
      if (error) throw new Error(error.message)
      deleteConfirm.cancel()
      await refresh()
      await refetch()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete books.')
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
        .map((id) => rows.find((row) => row.id === id))
        .filter((row): row is Row => Boolean(row))
        .map((row) => ({
          ...row,
          status,
          published_at: status === 'published' ? row.published_at ?? new Date().toISOString() : row.published_at,
        }))
      await persistRows(payload)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not update books.')
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

  useAdminPageHeader({
    title: 'Books',
    description: "Featured books and surahs of the Qur'an.",
    actions: useMemo(
      () => [{ label: 'Add book', onClick: () => setDraft({ id: crypto.randomUUID(), status: 'draft' }) }],
      [],
    ),
  })

  const isEditing = Boolean(draft?.id && rows.some((row) => row.id === draft.id))

  const categoryChips = useMemo(
    () => [{ value: 'all', label: 'All categories' }, ...categories.map((category) => ({ value: category, label: category }))],
    [categories],
  )

  return (
    <div className="flex flex-col gap-4">
      {err ? <p className="text-sm text-red-400">{err}</p> : null}

      <div className="flex flex-col gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, slug, category…"
            aria-label="Search books"
            className="h-10 bg-white"
          />
          <AdminSelect
            value={categoryFilter}
            onValueChange={setCategoryFilter}
            placeholder="Category"
            className="h-10 bg-white"
            options={categoryChips.map((chip) => ({
              value: chip.value,
              label: `${chip.label} (${categoryCounts[chip.value] ?? 0})`,
            }))}
          />
        </div>

        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
          <TabsList variant="line" className="h-auto w-full max-w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            {(
              [
                { value: 'all', label: 'All', count: statusCounts.all },
                { value: 'draft', label: 'Draft', count: statusCounts.draft },
                { value: 'published', label: 'Published', count: statusCounts.published },
              ] as const
            ).map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="h-9 gap-2 rounded-full border border-transparent px-3 data-active:border-[#e5e5e5] data-active:bg-white data-active:shadow-none data-[state=active]:border-[#e5e5e5] data-[state=active]:bg-white data-[state=active]:shadow-none"
              >
                {tab.label}
                <Badge variant={statusFilter === tab.value ? 'default' : 'secondary'} className="h-5 min-w-5 px-1.5">
                  {tab.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {selectedCount > 0 ? (
        <div className="admin-panel flex flex-wrap items-center gap-2 px-4 py-3">
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
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all books" />
              </th>
              <th className={cn(adminTh, 'w-24')}>Image</th>
              <th className={adminTh}>Title</th>
              <th className={adminTh}>Category</th>
              <th className={adminTh}>Order</th>
              <th className={adminTh}>Status</th>
              <th className={adminTh}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td className={cn(adminTd, 'admin-muted py-12 text-center')} colSpan={7}>
                  {rows.length === 0 ? 'No books yet.' : 'No books match your filters.'}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={row.id} className="[&>td]:hover:bg-[#f5f5f3]">
                  <td className={adminTd}>
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      aria-label={`Select ${row.title}`}
                    />
                  </td>
                  <td className={adminTd}>
                    <AdminTableImageCell src={row.cover_image_url} label="Edit book" onClick={() => setDraft(row)} />
                  </td>
                  <td className={adminTd}>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-[#171717]">{row.title}</span>
                      <span className="admin-muted text-xs">{row.slug}</span>
                    </div>
                  </td>
                  <td className={adminTd}>{row.category}</td>
                  <td className={adminTd}>{row.sort_order}</td>
                  <td className={adminTd}>
                    <Badge variant={row.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                      {row.status}
                    </Badge>
                  </td>
                  <td className={adminTd}>
                    <div className="flex flex-wrap gap-2">
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
        title={isEditing ? 'Edit book' : 'Add book'}
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
            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="admin-label">Title</span>
              <input className="admin-input" value={draft.title ?? ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="admin-label">Category</span>
              <input className="admin-input" value={draft.category ?? ''} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="admin-label">Status</span>
              <AdminSelect
                value={draft.status ?? 'draft'}
                onValueChange={(status) => setDraft({ ...draft, status })}
                options={ADMIN_STATUS_OPTIONS}
              />
            </label>
            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="admin-label">Excerpt</span>
              <textarea className="admin-input min-h-20" value={draft.excerpt ?? ''} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} />
            </label>
            <ImageUploadField
              label="Detail banner (1920×300)"
              folder="books"
              value={draft.cover_image_url ?? ''}
              onChange={(v) => setDraft({ ...draft, cover_image_url: v })}
              hint="Wide banner for the book detail page."
            />
            <ImageUploadField
              label="Card cover (16:9)"
              folder="books"
              value={draft.card_cover_image_url ?? ''}
              onChange={(v) => setDraft({ ...draft, card_cover_image_url: v })}
              hint="Optional. 1280×720 or 1920×1080 for listing cards. Leave empty to crop the detail banner."
            />
            <label className="flex flex-col gap-2">
              <span className="admin-label">Sort order</span>
              <input className="admin-input" type="number" value={draft.sort_order ?? 0} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
            </label>
            <RichTextEditor className="md:col-span-2" label="Body" value={draft.body_html ?? ''} onChange={(body_html) => setDraft({ ...draft, body_html })} />
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
