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
import { AdminSelect } from './components/AdminSelect'
import { resolveSlugFromLabel, slugify } from '#/lib/slug'
import { useAdminDeleteConfirm } from './useAdminDeleteConfirm'
import { cn } from '#/lib/utils'

type Row = Database['public']['Tables']['dq_donation_products']['Row']

const KIND_LABELS: Record<string, string> = {
  product: 'Donation products',
  quick: 'Quick donation',
  free: 'Free requests',
}

function kindLabel(kind: string) {
  return KIND_LABELS[kind] ?? kind.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const emptyRow = (kind = 'product'): Partial<Row> => ({
  id: crypto.randomUUID(),
  kind,
  published: true,
  is_active: true,
  sort_order: 0,
  cta_label: 'DONATE NOW',
  cta_url: '/donate',
  currency: 'GBP',
  description: '',
  requires_shipping: false,
  max_quantity: 99,
})

export function AdminProducts() {
  const { refetch } = useCms()
  const [rows, setRows] = useState<Row[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<Row> | null>(null)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const deleteConfirm = useAdminDeleteConfirm({ singular: 'product', plural: 'products' })
  const [activeKind, setActiveKind] = useState<'all' | string>('all')

  const kinds = useMemo(() => {
    const unique = new Set(rows.map((row) => row.kind || 'product'))
    return [...unique].sort((a, b) => a.localeCompare(b))
  }, [rows])

  const filteredRows = useMemo(() => {
    if (activeKind === 'all') return rows
    return rows.filter((row) => row.kind === activeKind)
  }, [rows, activeKind])

  const { page, setPage, totalPages, pageRows } = useAdminTablePagination(filteredRows)

  const selectedCount = selected.size
  const allSelected = filteredRows.length > 0 && filteredRows.every((row) => selected.has(row.id))

  async function refresh() {
    const sb = getSupabase()
    if (!sb) return
    const { data, error } = await sb.from('dq_donation_products').select('*').order('sort_order')
    if (error) return setErr(error.message)
    setErr(null)
    setRows(data ?? [])
    setSelected(new Set())
  }

  useEffect(() => {
    void refresh()
  }, [])

  useEffect(() => {
    if (activeKind !== 'all' && kinds.length > 0 && !kinds.includes(activeKind)) {
      setActiveKind('all')
    }
  }, [activeKind, kinds])

  async function persistRows(items: Row[]) {
    const sb = getSupabase()
    if (!sb) return
    const { error } = await sb.from('dq_donation_products').upsert(items, { onConflict: 'id' })
    if (error) throw new Error(error.message)
    await refresh()
    await refetch()
  }

  async function saveModal() {
    if (!draft?.title || !draft.image_url) {
      setSaveErr('Title and image are required.')
      return
    }
    setBusy(true)
    setSaveErr(null)
    try {
      const existing = rows.find((row) => row.id === draft.id)
      const slug = existing
        ? resolveSlugFromLabel(draft.title, existing.title, existing.slug)
        : draft.slug?.trim() ||
          `${slugify(draft.title) || 'product'}-${crypto.randomUUID().slice(0, 8)}`
      const { is_free: _omitIsFree, ...rest } = draft as Partial<Row> & { is_free?: boolean }
      await persistRows([
        {
          ...rest,
          slug,
        } as Row,
      ])
      setDraft(null)
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Could not save product.')
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
      const { error } = await sb.from('dq_donation_products').delete().in('id', ids)
      if (error) throw new Error(error.message)
      deleteConfirm.cancel()
      await refresh()
      await refetch()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete products.')
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
      setErr(e instanceof Error ? e.message : 'Could not update products.')
    } finally {
      setBusy(false)
    }
  }

  function buildDuplicate(row: Row): Row {
    const title = `${row.title} (copy)`
    const suffix = crypto.randomUUID().slice(0, 8)
    return {
      ...row,
      id: crypto.randomUUID(),
      title,
      slug: `${slugify(title) || slugify(row.title) || 'product'}-${suffix}`,
      published: false,
      sort_order: (row.sort_order ?? 0) + 1,
    }
  }

  function duplicateRow(row: Row) {
    setSaveErr(null)
    setDraft(buildDuplicate(row))
  }

  async function duplicateSelected() {
    const ids = [...selected]
    if (!ids.length) return
    setBusy(true)
    setErr(null)
    try {
      const payload = ids
        .map((id) => rows.find((r) => r.id === id))
        .filter((row): row is Row => Boolean(row))
        .map((row) => buildDuplicate(row))
      await persistRows(payload)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not duplicate products.')
    } finally {
      setBusy(false)
    }
  }

  function switchKindTab(kind: 'all' | string) {
    setActiveKind(kind)
    setPage(1)
    setSelected(new Set())
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

  const addKind = activeKind === 'all' ? 'product' : activeKind

  const headerActions = useMemo(
    () => [
      {
        label: activeKind === 'all' ? 'Add product' : `Add ${kindLabel(addKind).toLowerCase()}`,
        onClick: () => setDraft(emptyRow(addKind)),
      },
    ],
    [activeKind, addKind],
  )

  useAdminPageHeader({
    title: 'Donation products',
    description: 'Browse by kind, then edit or bulk-manage items.',
    actions: headerActions,
  })

  const tabs = useMemo(
    () => [
      { id: 'all' as const, label: 'All', count: rows.length },
      ...kinds.map((kind) => ({
        id: kind,
        label: kindLabel(kind),
        count: rows.filter((row) => row.kind === kind).length,
      })),
    ],
    [kinds, rows],
  )

  const kindOptions = useMemo(() => {
    const set = new Set([...kinds, 'product', 'quick', 'free'])
    if (draft?.kind) set.add(draft.kind)
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [kinds, draft?.kind])

  return (
    <div>
      {err ? <p className="mb-4 text-sm text-red-400">{err}</p> : null}

      <div className="admin-tabs" role="tablist" aria-label="Product kinds">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeKind === tab.id}
            className={cn('admin-tab', activeKind === tab.id && 'admin-tab-active')}
            onClick={() => switchKindTab(tab.id)}
          >
            {tab.label}
            <span className="admin-muted ml-1.5 text-xs">({tab.count})</span>
          </button>
        ))}
      </div>

      {selectedCount > 0 ? (
        <div className="admin-panel mb-4 flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="admin-muted text-sm">{selectedCount} selected</span>
          <button type="button" className="admin-btn-secondary" disabled={busy} onClick={() => void bulkSetPublished(true)}>
            Publish
          </button>
          <button type="button" className="admin-btn-secondary" disabled={busy} onClick={() => void bulkSetPublished(false)}>
            Unpublish
          </button>
          <button type="button" className="admin-btn-secondary" disabled={busy} onClick={() => void duplicateSelected()}>
            Duplicate selected
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
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all products" />
              </th>
              <th className={cn(adminTh, 'w-20')}>Image</th>
              <th className={adminTh}>Title</th>
              <th className={adminTh}>Slug</th>
              {activeKind === 'all' ? <th className={adminTh}>Kind</th> : null}
              <th className={adminTh}>Price</th>
              <th className={adminTh}>Order</th>
              <th className={adminTh}>Published</th>
              <th className={adminTh}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td className={cn(adminTd, 'admin-muted py-10 text-center')} colSpan={activeKind === 'all' ? 9 : 8}>
                  No products in this tab yet.
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
                      title="Edit product"
                    >
                      {row.image_url ? (
                        <img src={row.image_url} alt="" className="h-12 w-12 object-cover" />
                      ) : (
                        <div className="admin-muted flex h-12 w-12 items-center justify-center text-[10px]">No image</div>
                      )}
                    </button>
                  </td>
                  <td className={adminTd}>{row.title}</td>
                  <td className={adminTd}>{row.slug}</td>
                  {activeKind === 'all' ? <td className={adminTd}>{kindLabel(row.kind)}</td> : null}
                  <td className={adminTd}>{row.price ?? '—'}</td>
                  <td className={adminTd}>{row.sort_order}</td>
                  <td className={adminTd}>{row.published ? 'Yes' : 'No'}</td>
                  <td className={adminTd}>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="admin-btn-secondary" onClick={() => setDraft(row)}>
                        Edit
                      </button>
                      <button type="button" className="admin-btn-secondary" disabled={busy} onClick={() => duplicateRow(row)}>
                        Duplicate
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
        title={
          draft?.id && rows.some((r) => r.id === draft.id)
            ? 'Edit product'
            : draft?.title?.endsWith('(copy)')
              ? 'Duplicate product'
              : 'Add product'
        }
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
              <span className="admin-label">Description</span>
              <textarea className="admin-input min-h-20" value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </label>
            <ImageUploadField
              label="Product image"
              folder={draft.kind === 'quick' ? 'quick-donation' : 'donation-products'}
              value={draft.image_url ?? ''}
              onChange={(v) => setDraft({ ...draft, image_url: v })}
            />
            <label className="block space-y-2">
              <span className="admin-label">Kind</span>
              <AdminSelect
                value={draft.kind ?? 'product'}
                onValueChange={(kind) => setDraft({ ...draft, kind })}
                options={kindOptions.map((kind) => ({ value: kind, label: kindLabel(kind) }))}
              />
            </label>
            <label className="block space-y-2">
              <span className="admin-label">Price</span>
              <input className="admin-input" type="number" value={draft.price ?? ''} onChange={(e) => setDraft({ ...draft, price: e.target.value ? Number(e.target.value) : null })} />
            </label>
            <label className="block space-y-2">
              <span className="admin-label">CTA URL</span>
              <input className="admin-input" value={draft.cta_url ?? ''} onChange={(e) => setDraft({ ...draft, cta_url: e.target.value })} />
            </label>
            <label className="block space-y-2">
              <span className="admin-label">Sort order</span>
              <input className="admin-input" type="number" value={draft.sort_order ?? 0} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
            </label>
            <label className="block space-y-2">
              <span className="admin-label">Max quantity</span>
              <input
                className="admin-input"
                type="number"
                value={draft.max_quantity ?? 99}
                onChange={(e) => setDraft({ ...draft, max_quantity: Number(e.target.value) || 99 })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.published ?? true} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(draft.requires_shipping)}
                onChange={(e) => setDraft({ ...draft, requires_shipping: e.target.checked })}
              />
              Requires shipping (collect delivery address)
            </label>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={
                  draft.kind === 'free' ||
                  Boolean(draft.is_free) ||
                  (((draft.price ?? 0) <= 0) && Boolean(draft.requires_shipping))
                }
                onChange={(e) => {
                  const on = e.target.checked
                  setDraft({
                    ...draft,
                    // Keep kind as quick until DB allows kind=free (check constraint).
                    kind: on ? (draft.kind === 'product' ? 'quick' : draft.kind || 'quick') : draft.kind === 'free' ? 'product' : draft.kind,
                    price: on ? 0 : draft.price && draft.price > 0 ? draft.price : draft.price,
                    requires_shipping: on ? true : draft.requires_shipping,
                    cta_label: on ? 'REQUEST FREE COPY' : draft.cta_label,
                    cta_url: on ? '/order-free-qurans' : draft.cta_url,
                  })
                }}
              />
              Free request product (separate form, not gift cart)
            </label>
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
