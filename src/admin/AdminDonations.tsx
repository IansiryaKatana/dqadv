import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMarkInboxViewed } from '#/admin/AdminInboxContext'
import { useAdminAuth } from '#/contexts/AdminAuthContext'
import {
  bulkDeleteDonations,
  bulkUpdateDonationFulfillment,
  listDonationsAdmin,
  resendDonationReceiptFn,
  updateDonationFulfillment,
} from '#/lib/donor/donorAccountApi'
import type { GiftCartItem } from '#/lib/commerce/types'
import { formatPrice, cn } from '#/lib/utils'
import { useAdminPageHeader } from './AdminPageContext'
import { adminFilters, adminTable, adminTableWrap, adminTd, adminTh } from './adminClassNames'
import { AdminDeleteConfirmDialog } from './components/AdminDeleteConfirmDialog'
import { AdminModal } from './components/AdminModal'
import { AdminSelect } from './components/AdminSelect'
import { AdminTablePagination } from './components/AdminTablePagination'
import { ADMIN_FULFILLMENT_OPTIONS, ADMIN_PAYMENT_STATUS_OPTIONS } from './adminSelectOptions'
import { useAdminDeleteConfirm } from './useAdminDeleteConfirm'
import { formatAdminDate, formatAdminTime } from './formatAdminDate'
import { useAdminTablePagination } from './useAdminTablePagination'

type ShippingAddress = {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

type DonationRow = {
  id: string
  reference: string
  donor_name: string
  donor_email: string
  donor_phone: string | null
  shipping_address: unknown
  total: number
  currency: string
  payment_status: string
  payment_provider: string | null
  fulfillment_status: string
  admin_notes: string | null
  dedication: string | null
  cart_snapshot: unknown
  created_at: string
}

function parseShippingAddress(value: unknown): ShippingAddress | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const row = value as Record<string, unknown>
  const line1 = typeof row.line1 === 'string' ? row.line1.trim() : ''
  if (!line1) return null
  return {
    line1,
    line2: typeof row.line2 === 'string' ? row.line2.trim() : '',
    city: typeof row.city === 'string' ? row.city.trim() : '',
    state: typeof row.state === 'string' ? row.state.trim() : '',
    postalCode: typeof row.postalCode === 'string' ? row.postalCode.trim() : '',
    country: typeof row.country === 'string' ? row.country.trim() : '',
  }
}

function parseCartItems(value: unknown): GiftCartItem[] {
  if (!Array.isArray(value)) return []
  return value as GiftCartItem[]
}

function cartQuantity(value: unknown): number {
  return parseCartItems(value).reduce((sum, item) => {
    const qty = Number(item.quantity)
    return sum + (Number.isFinite(qty) && qty > 0 ? qty : 0)
  }, 0)
}

function formatStatusLabel(value: string) {
  if (!value) return '—'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const PAYMENT_BADGE_CLASS: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-slate-100 text-slate-700',
}

const FULFILLMENT_BADGE_CLASS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-sky-100 text-sky-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
}

function StatusBadge({ label, className }: { label: string; className: string }) {
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize', className)}>
      {label}
    </span>
  )
}

function PaymentBadge({ status }: { status: string }) {
  return (
    <StatusBadge
      label={formatStatusLabel(status)}
      className={PAYMENT_BADGE_CLASS[status] ?? 'bg-slate-100 text-slate-700'}
    />
  )
}

function FulfillmentBadge({ status }: { status: string }) {
  return (
    <StatusBadge
      label={formatStatusLabel(status)}
      className={FULFILLMENT_BADGE_CLASS[status] ?? 'bg-slate-100 text-slate-700'}
    />
  )
}

export function AdminDonations() {
  useMarkInboxViewed('donations')
  const { session } = useAdminAuth()
  const [rows, setRows] = useState<DonationRow[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<DonationRow | null>(null)
  const [fulfillment, setFulfillment] = useState('pending')
  const [bulkFulfillment, setBulkFulfillment] = useState('processing')
  const [adminNotes, setAdminNotes] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [fulfillmentFilter, setFulfillmentFilter] = useState('all')
  const deleteConfirm = useAdminDeleteConfirm({ singular: 'donation', plural: 'donations' })

  const load = useCallback(async () => {
    if (!session?.access_token) return
    try {
      const data = await listDonationsAdmin({ data: { accessToken: session.access_token } })
      setRows((data ?? []) as DonationRow[])
      setSelectedIds(new Set())
      setErr(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load donations.')
    }
  }, [session?.access_token])

  useEffect(() => {
    void load()
  }, [load])

  useAdminPageHeader({
    title: 'Donations',
    description: 'Gift completions, payment status, and fulfillment. Select rows for bulk updates.',
    actions: [],
  })

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (paymentFilter !== 'all' && row.payment_status !== paymentFilter) return false
      if (fulfillmentFilter !== 'all' && row.fulfillment_status !== fulfillmentFilter) return false
      return true
    })
  }, [rows, paymentFilter, fulfillmentFilter])

  const { page, setPage, totalPages, pageRows } = useAdminTablePagination(filteredRows, 12)

  useEffect(() => {
    setPage(1)
  }, [paymentFilter, fulfillmentFilter, setPage])

  const selectedCount = selectedIds.size
  const allPageSelected = pageRows.length > 0 && pageRows.every((row) => selectedIds.has(row.id))

  function toggleSelectAll() {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (const row of pageRows) next.delete(row.id)
        return next
      })
      return
    }
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const row of pageRows) next.add(row.id)
      return next
    })
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function openDetail(row: DonationRow) {
    setSelected(row)
    setFulfillment(row.fulfillment_status)
    setAdminNotes(row.admin_notes ?? '')
    setErr(null)
    setMsg(null)
  }

  async function saveFulfillment() {
    if (!selected || !session?.access_token) return
    setBusy(true)
    setErr(null)
    try {
      await updateDonationFulfillment({
        data: {
          accessToken: session.access_token,
          donationId: selected.id,
          fulfillmentStatus: fulfillment,
          adminNotes,
        },
      })
      setMsg('Fulfillment updated.')
      await load()
      setSelected((prev) =>
        prev ? { ...prev, fulfillment_status: fulfillment, admin_notes: adminNotes } : null,
      )
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed.')
    } finally {
      setBusy(false)
    }
  }

  async function resendReceipt() {
    if (!selected || !session?.access_token) return
    setBusy(true)
    setErr(null)
    try {
      await resendDonationReceiptFn({
        data: { accessToken: session.access_token, donationId: selected.id },
      })
      setMsg('Receipt resent.')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not resend receipt.')
    } finally {
      setBusy(false)
    }
  }

  async function applyBulkFulfillment() {
    if (!session?.access_token || !selectedCount) return
    setBusy(true)
    setErr(null)
    setMsg(null)
    try {
      const result = await bulkUpdateDonationFulfillment({
        data: {
          accessToken: session.access_token,
          donationIds: [...selectedIds],
          fulfillmentStatus: bulkFulfillment,
        },
      })
      setMsg(`Updated fulfillment on ${result.count} donation${result.count === 1 ? '' : 's'}.`)
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Bulk update failed.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(ids: string[]) {
    if (!session?.access_token || !ids.length) return
    setBusy(true)
    setErr(null)
    setMsg(null)
    try {
      const result = await bulkDeleteDonations({
        data: { accessToken: session.access_token, donationIds: ids },
      })
      deleteConfirm.cancel()
      if (selected && ids.includes(selected.id)) setSelected(null)
      setMsg(`Deleted ${result.count} donation${result.count === 1 ? '' : 's'}.`)
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete donations.')
    } finally {
      setBusy(false)
    }
  }

  const items = selected ? parseCartItems(selected.cart_snapshot) : []
  const shipping = selected ? parseShippingAddress(selected.shipping_address) : null
  const needsShipping = items.some((item) => item.requiresShipping)
  const totalQuantity = selected ? cartQuantity(selected.cart_snapshot) : 0

  return (
    <div>
      {err && !selected ? <p className="mb-4 text-sm text-red-400">{err}</p> : null}
      {msg && !selected ? <p className="mb-4 text-sm text-emerald-600">{msg}</p> : null}

      <div className={adminFilters}>
        <AdminSelect
          value={paymentFilter}
          onValueChange={setPaymentFilter}
          options={[{ value: 'all', label: 'All payments' }, ...ADMIN_PAYMENT_STATUS_OPTIONS]}
          placeholder="Payment"
        />
        <AdminSelect
          value={fulfillmentFilter}
          onValueChange={setFulfillmentFilter}
          options={[{ value: 'all', label: 'All fulfillment' }, ...ADMIN_FULFILLMENT_OPTIONS]}
          placeholder="Fulfillment"
        />
      </div>

      {selectedCount > 0 ? (
        <div className="admin-panel mb-4 flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="admin-muted text-sm">{selectedCount} selected</span>
          <div className="w-44">
            <AdminSelect
              value={bulkFulfillment}
              onValueChange={setBulkFulfillment}
              options={ADMIN_FULFILLMENT_OPTIONS}
            />
          </div>
          <button type="button" className="admin-btn-secondary" disabled={busy} onClick={() => void applyBulkFulfillment()}>
            Set fulfillment
          </button>
          <button
            type="button"
            className="admin-btn-danger"
            disabled={busy}
            onClick={() => deleteConfirm.request([...selectedIds])}
          >
            Delete selected
          </button>
        </div>
      ) : null}

      <div className={adminTableWrap}>
        <table className={adminTable}>
          <thead>
            <tr>
              <th className={cn(adminTh, 'w-10')}>
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all donations on this page"
                />
              </th>
              <th className={adminTh}>Reference</th>
              <th className={adminTh}>Donor</th>
              <th className={adminTh}>Qty</th>
              <th className={adminTh}>Total</th>
              <th className={adminTh}>Payment</th>
              <th className={adminTh}>Fulfillment</th>
              <th className={adminTh}>Date</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={8} className={adminTd}>
                  {rows.length === 0 ? 'No donations yet.' : 'No donations match these filters.'}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer hover:bg-[#fafafa]"
                  onClick={() => openDetail(row)}
                >
                  <td className={adminTd} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      aria-label={`Select ${row.reference}`}
                    />
                  </td>
                  <td className={adminTd}>{row.reference}</td>
                  <td className={adminTd}>
                    {row.donor_name}
                    <br />
                    <span className="admin-muted text-xs">{row.donor_email}</span>
                  </td>
                  <td className={adminTd}>{cartQuantity(row.cart_snapshot)}</td>
                  <td className={adminTd}>{formatPrice(Number(row.total), row.currency)}</td>
                  <td className={adminTd}>
                    <PaymentBadge status={row.payment_status} />
                  </td>
                  <td className={adminTd}>
                    <FulfillmentBadge status={row.fulfillment_status} />
                  </td>
                  <td className={adminTd}>
                    <span className="block text-sm text-dq-black">{formatAdminDate(row.created_at)}</span>
                    <span className="admin-muted text-xs">{formatAdminTime(row.created_at)}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminTablePagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <AdminModal
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        title={selected?.reference ?? 'Donation'}
        wide
        footer={
          <>
            <button type="button" className="admin-btn-primary" disabled={busy} onClick={() => void saveFulfillment()}>
              Save
            </button>
            {selected?.payment_status === 'paid' ? (
              <button type="button" className="admin-btn-secondary" disabled={busy} onClick={() => void resendReceipt()}>
                Resend receipt
              </button>
            ) : null}
            {selected ? (
              <button
                type="button"
                className="admin-btn-danger"
                disabled={busy}
                onClick={() => deleteConfirm.request([selected.id])}
              >
                Delete
              </button>
            ) : null}
            <button type="button" className="admin-btn-secondary" onClick={() => setSelected(null)}>
              Close
            </button>
          </>
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase text-[#737373]">Donor</p>
                <p className="text-sm">{selected.donor_name}</p>
                <p className="text-xs text-[#737373]">{selected.donor_email}</p>
                {selected.donor_phone ? (
                  <p className="text-xs text-[#737373]">{selected.donor_phone}</p>
                ) : null}
              </div>
              <div>
                <p className="text-xs uppercase text-[#737373]">Quantity</p>
                <p className="text-sm font-medium">{totalQuantity}</p>
                <p className="text-xs text-[#737373]">
                  {items.length} item{items.length === 1 ? '' : 's'} in cart
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-[#737373]">Payment</p>
                <PaymentBadge status={selected.payment_status} />
                <p className="mt-1 text-sm font-medium">{formatPrice(Number(selected.total), selected.currency)}</p>
              </div>
            </div>
            {selected.dedication ? (
              <p className="text-sm italic text-[#737373]">{selected.dedication}</p>
            ) : null}
            {shipping || needsShipping ? (
              <div>
                <p className="mb-2 text-xs uppercase text-[#737373]">Delivery</p>
                {shipping ? (
                  <div className="text-sm">
                    <p>{shipping.line1}</p>
                    {shipping.line2 ? <p>{shipping.line2}</p> : null}
                    <p>
                      {[shipping.city, shipping.state, shipping.postalCode].filter(Boolean).join(', ')}
                    </p>
                    {shipping.country ? <p>{shipping.country}</p> : null}
                  </div>
                ) : (
                  <p className="text-sm text-[#737373]">No delivery address on file.</p>
                )}
              </div>
            ) : null}
            <div>
              <p className="mb-2 text-xs uppercase text-[#737373]">Gift items</p>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.productId} className="grid grid-cols-[1fr_auto_auto] items-baseline gap-4 text-sm">
                    <span>{item.title}</span>
                    <span className="tabular-nums text-[#737373]">Qty {item.quantity}</span>
                    <span>
                      {item.unitAmount != null
                        ? formatPrice(item.unitAmount * item.quantity, item.currency)
                        : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#737373]">
                Fulfillment status
                <FulfillmentBadge status={fulfillment} />
              </label>
              <AdminSelect
                value={fulfillment}
                onValueChange={setFulfillment}
                options={ADMIN_FULFILLMENT_OPTIONS}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#737373]">
                Admin notes
              </label>
              <textarea className="admin-input min-h-20" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
            </div>
            {err ? <p className="text-sm text-red-400">{err}</p> : null}
            {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}
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
