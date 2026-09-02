import { useEffect, useState } from 'react'
import { getSupabase } from '#/integrations/supabase/client'
import { useAdminPageHeader } from './AdminPageContext'
import { AdminDeleteConfirmDialog } from './components/AdminDeleteConfirmDialog'
import { adminTable, adminTableWrap, adminTd, adminTh } from './adminClassNames'
import { useAdminDeleteConfirm } from './useAdminDeleteConfirm'
import { formatPrice } from '#/lib/utils'

type Row = {
  id: string
  amount: number
  currency: string
  sort_order: number
  is_active: boolean
}

export function AdminGivePresets() {
  const [rows, setRows] = useState<Row[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [amount, setAmount] = useState('10')
  const [busy, setBusy] = useState(false)
  const deleteConfirm = useAdminDeleteConfirm({ singular: 'preset', plural: 'presets' })

  async function refresh() {
    const sb = getSupabase()
    if (!sb) return
    const { data, error } = await sb.from('dq_donate_presets').select('*').order('sort_order')
    if (error) return setErr(error.message)
    setErr(null)
    setRows((data ?? []) as Row[])
  }

  useEffect(() => {
    void refresh()
  }, [])

  useAdminPageHeader({
    title: 'Give presets',
    description: 'Amounts shown on the public Give page. Donors can still enter a custom amount.',
    actions: [],
  })

  async function addPreset() {
    const sb = getSupabase()
    if (!sb) return
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) return setErr('Enter a positive amount.')
    setBusy(true)
    const { error } = await sb.from('dq_donate_presets').insert({
      amount: value,
      currency: 'GBP',
      sort_order: rows.length + 1,
      is_active: true,
    } as never)
    setBusy(false)
    if (error) return setErr(error.message)
    setAmount('')
    await refresh()
  }

  async function toggle(row: Row) {
    const sb = getSupabase()
    if (!sb) return
    await sb.from('dq_donate_presets').update({ is_active: !row.is_active } as never).eq('id', row.id)
    await refresh()
  }

  async function remove(ids: string[]) {
    const sb = getSupabase()
    if (!sb) return
    setBusy(true)
    await sb.from('dq_donate_presets').delete().in('id', ids)
    setBusy(false)
    deleteConfirm.cancel()
    await refresh()
  }

  return (
    <div>
      {err ? <p className="mb-4 text-sm text-red-500">{err}</p> : null}
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <label className="text-sm">
          Amount (£)
          <input
            className="admin-input mt-1 block"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <button type="button" className="admin-btn-primary" disabled={busy} onClick={() => void addPreset()}>
          Add preset
        </button>
      </div>
      <div className={adminTableWrap}>
        <table className={adminTable}>
          <thead>
            <tr>
              <th className={adminTh}>Amount</th>
              <th className={adminTh}>Active</th>
              <th className={adminTh} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className={adminTd}>{formatPrice(Number(row.amount), row.currency)}</td>
                <td className={adminTd}>
                  <button type="button" className="admin-btn-secondary" onClick={() => void toggle(row)}>
                    {row.is_active ? 'Active' : 'Hidden'}
                  </button>
                </td>
                <td className={adminTd}>
                  <button type="button" className="admin-btn-danger" onClick={() => deleteConfirm.request([row.id])}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
