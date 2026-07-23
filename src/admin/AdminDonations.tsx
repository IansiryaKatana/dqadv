import { useCallback, useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { getSupabase } from '#/integrations/supabase/client'
import { useAdminAuth } from '#/contexts/AdminAuthContext'
import { useAdminPageHeader } from './AdminPageContext'
import { adminTable, adminTableWrap, adminTd, adminTh } from './adminClassNames'
import { AdminSelect } from './components/AdminSelect'
import { ADMIN_FULFILLMENT_OPTIONS } from './adminSelectOptions'
import { formatPrice } from '#/lib/utils'
import { resendDonationReceiptFn, updateDonationFulfillment } from '#/lib/donor/donorAccountApi'
import type { GiftCartItem } from '#/lib/commerce/types'

type DonationRow = {
  id: string
  reference: string
  donor_name: string
  donor_email: string
  donor_phone: string | null
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

export function AdminDonations() {
  const { session } = useAdminAuth()
  const [rows, setRows] = useState<DonationRow[]>([])
  const [selected, setSelected] = useState<DonationRow | null>(null)
  const [fulfillment, setFulfillment] = useState('pending')
  const [adminNotes, setAdminNotes] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) return
    const { data, error } = await sb
      .from('dq_donations')
      .select(
        'id, reference, donor_name, donor_email, donor_phone, total, currency, payment_status, payment_provider, fulfillment_status, admin_notes, dedication, cart_snapshot, created_at',
      )
      .order('created_at', { ascending: false })
    if (error) setErr(error.message)
    else setRows((data ?? []) as DonationRow[])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useAdminPageHeader({
    title: 'Donations',
    description: 'Gift completions, payment status, and fulfillment.',
    actions: [],
  })

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

  const items = (Array.isArray(selected?.cart_snapshot) ? selected.cart_snapshot : []) as GiftCartItem[]

  return (
    <div>
      {err && !selected ? <p className="mb-4 text-sm text-red-400">{err}</p> : null}
      <div className={adminTableWrap}>
        <table className={adminTable}>
          <thead>
            <tr>
              <th className={adminTh}>Reference</th>
              <th className={adminTh}>Donor</th>
              <th className={adminTh}>Total</th>
              <th className={adminTh}>Payment</th>
              <th className={adminTh}>Fulfillment</th>
              <th className={adminTh}>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className={adminTd}>
                  No donations yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer hover:bg-[#fafafa]"
                  onClick={() => openDetail(row)}
                >
                  <td className={adminTd}>{row.reference}</td>
                  <td className={adminTd}>
                    {row.donor_name}
                    <br />
                    <span className="admin-muted text-xs">{row.donor_email}</span>
                  </td>
                  <td className={adminTd}>{formatPrice(Number(row.total), row.currency)}</td>
                  <td className={adminTd}>
                    {row.payment_provider ?? '—'} / {row.payment_status}
                  </td>
                  <td className={adminTd}>{row.fulfillment_status}</td>
                  <td className={adminTd}>{new Date(row.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog.Root open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/40" />
          <Dialog.Content className="fixed z-[90] flex max-h-[92dvh] w-full flex-col overflow-hidden bg-white shadow-2xl outline-none bottom-0 left-0 right-0 rounded-t-2xl mb-0 md:bottom-auto md:left-1/2 md:top-1/2 md:max-w-2xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] px-5 py-4">
              <Dialog.Title className="font-semibold text-dq-black">{selected?.reference}</Dialog.Title>
              <Dialog.Close className="rounded-full p-2 hover:bg-[#f5f5f5]" aria-label="Close">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {selected ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase text-[#737373]">Donor</p>
                      <p className="text-sm">{selected.donor_name}</p>
                      <p className="text-xs text-[#737373]">{selected.donor_email}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-[#737373]">Payment</p>
                      <p className="text-sm">
                        {selected.payment_provider} · {selected.payment_status}
                      </p>
                      <p className="text-sm font-medium">{formatPrice(Number(selected.total), selected.currency)}</p>
                    </div>
                  </div>
                  {selected.dedication ? (
                    <p className="text-sm italic text-[#737373]">{selected.dedication}</p>
                  ) : null}
                  <div>
                    <p className="mb-2 text-xs uppercase text-[#737373]">Gift items</p>
                    <ul className="space-y-2">
                      {items.map((item) => (
                        <li key={item.productId} className="flex justify-between text-sm">
                          <span>
                            {item.title} × {item.quantity}
                          </span>
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
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#737373]">
                      Fulfillment status
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
            </div>
            <div className="flex flex-col gap-2 border-t border-[#e5e5e5] px-5 py-4 sm:flex-row">
              <button type="button" className="admin-btn-primary flex-1" disabled={busy} onClick={() => void saveFulfillment()}>
                Save
              </button>
              {selected?.payment_status === 'paid' ? (
                <button type="button" className="admin-btn-secondary flex-1" disabled={busy} onClick={() => void resendReceipt()}>
                  Resend receipt
                </button>
              ) : null}
              <Dialog.Close className="admin-btn-secondary flex-1">Close</Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
