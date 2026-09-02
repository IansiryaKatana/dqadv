import { useEffect, useState } from 'react'
import { getSupabase } from '#/integrations/supabase/client'
import { useAdminPageHeader } from './AdminPageContext'
import { adminTable, adminTableWrap, adminTd, adminTh } from './adminClassNames'
import { formatPrice } from '#/lib/utils'

type Row = {
  id: string
  band: string
  quantity: number
  copies: number
  cost: number
  postage: number
  total: number
  is_active: boolean
}

export function AdminPostageTiers() {
  const [rows, setRows] = useState<Row[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function refresh() {
    const sb = getSupabase()
    if (!sb) return
    const { data, error } = await sb.from('dq_quran_postage_tiers').select('*').order('sort_order')
    if (error) return setErr(error.message)
    setErr(null)
    setRows((data ?? []) as Row[])
  }

  useEffect(() => {
    void refresh()
  }, [])

  useAdminPageHeader({
    title: 'UK postage tiers',
    description: 'Cost, postage, and total charged for copies (1–9) and boxes of 10 (1–15). Checkout always uses these live values.',
    actions: [],
  })

  function updateLocal(id: string, field: keyof Row, value: string) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        const next = { ...row, [field]: field === 'band' ? value : Number(value) } as Row
        if (field === 'cost' || field === 'postage') {
          next.total = Number(next.cost) + Number(next.postage)
        }
        return next
      }),
    )
  }

  async function save(row: Row) {
    const sb = getSupabase()
    if (!sb) return
    setBusy(true)
    const total = Number(row.cost) + Number(row.postage)
    const { error } = await sb
      .from('dq_quran_postage_tiers')
      .update({
        cost: Number(row.cost),
        postage: Number(row.postage),
        total,
        copies: Number(row.copies),
        is_active: row.is_active,
      } as never)
      .eq('id', row.id)
    setBusy(false)
    if (error) return setErr(error.message)
    setMsg('Saved.')
    await refresh()
  }

  return (
    <div>
      {err ? <p className="mb-4 text-sm text-red-500">{err}</p> : null}
      {msg ? <p className="mb-4 text-sm text-emerald-600">{msg}</p> : null}
      <div className={adminTableWrap}>
        <table className={adminTable}>
          <thead>
            <tr>
              <th className={adminTh}>Band</th>
              <th className={adminTh}>Qty</th>
              <th className={adminTh}>Copies</th>
              <th className={adminTh}>Cost</th>
              <th className={adminTh}>Postage</th>
              <th className={adminTh}>Total</th>
              <th className={adminTh} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className={adminTd}>{row.band}</td>
                <td className={adminTd}>{row.quantity}</td>
                <td className={adminTd}>
                  <input
                    className="admin-input w-20"
                    value={row.copies}
                    onChange={(e) => updateLocal(row.id, 'copies', e.target.value)}
                  />
                </td>
                <td className={adminTd}>
                  <input
                    className="admin-input w-24"
                    value={row.cost}
                    onChange={(e) => updateLocal(row.id, 'cost', e.target.value)}
                  />
                </td>
                <td className={adminTd}>
                  <input
                    className="admin-input w-24"
                    value={row.postage}
                    onChange={(e) => updateLocal(row.id, 'postage', e.target.value)}
                  />
                </td>
                <td className={adminTd}>{formatPrice(Number(row.cost) + Number(row.postage), 'GBP')}</td>
                <td className={adminTd}>
                  <button type="button" className="admin-btn-secondary" disabled={busy} onClick={() => void save(row)}>
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
