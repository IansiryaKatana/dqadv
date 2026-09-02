import { useEffect, useMemo, useState } from 'react'
import type { Database } from '#/integrations/supabase/database.types'
import { getSupabase } from '#/integrations/supabase/client'
import { useCms } from '#/contexts/CmsContext'
import { resolveBrandTheme, resolveCustomSurfaceColor } from '#/lib/site/branding'
import { useAdminPageHeader } from './AdminPageContext'
import { AdminModal } from './components/AdminModal'
import { ImageUploadField } from './components/ImageUploadField'
import { AdminColorField } from './components/AdminColorField'
import { adminTable, adminTableWrap, adminTd, adminTh } from './adminClassNames'

type Row = Database['public']['Tables']['dq_hero_content']['Row']
type InsideRow = Database['public']['Tables']['dq_whats_inside']['Row']

export function AdminHero() {
  const { data, refetch } = useCms()
  const creamFallback = resolveBrandTheme(data?.siteSettings).cream
  const [rows, setRows] = useState<Row[]>([])
  const [inside, setInside] = useState<InsideRow | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [insideErr, setInsideErr] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<Row> | null>(null)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const [insideBusy, setInsideBusy] = useState(false)

  async function refresh() {
    const sb = getSupabase()
    if (!sb) return
    const [heroRes, insideRes] = await Promise.all([
      sb.from('dq_hero_content').select('*').order('updated_at', { ascending: false }),
      sb.from('dq_whats_inside').select('*').eq('is_active', true).limit(1).maybeSingle(),
    ])
    if (heroRes.error) {
      setErr(heroRes.error.message)
      return
    }
    setErr(null)
    setRows(heroRes.data ?? [])
    setInside(insideRes.data)
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function save() {
    if (!draft) return
    const sb = getSupabase()
    if (!sb) return
    setSaveErr(null)
    const row = {
      id: draft.id ?? crypto.randomUUID(),
      title_line1: draft.title_line1 ?? 'Faith.',
      title_line2: draft.title_line2 ?? 'Knowledge.',
      title_line3: draft.title_line3 ?? 'Impact.',
      highlight_word: draft.highlight_word ?? 'Impact.',
      description: draft.description ?? '',
      image_url: draft.image_url ?? '',
      image_url_tablet: draft.image_url_tablet?.trim() || null,
      image_url_mobile: draft.image_url_mobile?.trim() || null,
      primary_cta_label: draft.primary_cta_label ?? 'DONATE NOW',
      primary_cta_url: draft.primary_cta_url ?? '/donate',
      secondary_cta_label: draft.secondary_cta_label ?? 'ORDER A COPY',
      secondary_cta_url: draft.secondary_cta_url ?? '/order-free-qurans',
      is_active: draft.is_active ?? true,
    }
    const { error } = await sb.from('dq_hero_content').upsert(row, { onConflict: 'id' })
    if (error) {
      setSaveErr(error.message)
      return
    }
    setDraft(null)
    await refresh()
    await refetch()
  }

  async function saveInsideBackground() {
    if (!inside) return
    const sb = getSupabase()
    if (!sb) return
    if (!inside.image_url?.trim()) {
      setInsideErr('Background image is required.')
      return
    }
    setInsideBusy(true)
    setInsideErr(null)
    const { error } = await sb.from('dq_whats_inside').upsert(
      {
        ...inside,
        background_color: resolveCustomSurfaceColor(inside.background_color),
      },
      { onConflict: 'id' },
    )
    setInsideBusy(false)
    if (error) {
      setInsideErr(error.message)
      return
    }
    await refresh()
    await refetch()
  }

  const headerActions = useMemo(
    () => [{ label: 'Add hero', onClick: () => setDraft({ is_active: true }) }],
    [],
  )

  useAdminPageHeader({
    title: 'Hero',
    description: 'Homepage hero and What\'s Inside section background.',
    actions: headerActions,
  })

  return (
    <div>
      {err ? <p className="mb-4 text-sm text-red-400">{err}</p> : null}
      <div className={adminTableWrap}>
        <table className={adminTable}>
          <thead>
            <tr>
              <th className={adminTh}>Headline</th>
              <th className={adminTh}>Active</th>
              <th className={adminTh}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className={adminTd}>
                  {row.title_line1} {row.title_line2} {row.title_line3}
                </td>
                <td className={adminTd}>{row.is_active ? 'Yes' : 'No'}</td>
                <td className={adminTd}>
                  <button type="button" className="admin-btn-secondary" onClick={() => setDraft(row)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {inside ? (
        <div className="admin-panel mt-6 space-y-4 p-4">
          <div>
            <h2 className="font-semibold">What&apos;s Inside — section background</h2>
            <p className="admin-muted mt-1 text-sm">
              The cover image fills the section. Background color shows behind the image and while it loads.
            </p>
          </div>
          <ImageUploadField
            label="Background image"
            folder="whats-inside"
            value={inside.image_url ?? ''}
            onChange={(v) => setInside({ ...inside, image_url: v })}
          />
          <div className="max-w-xs">
            <AdminColorField
              label="Background color"
              value={resolveCustomSurfaceColor(inside.background_color) ?? ''}
              fallback={creamFallback}
              onChange={(value) => setInside({ ...inside, background_color: value })}
            />
          </div>
          {insideErr ? <p className="text-sm text-red-400">{insideErr}</p> : null}
          <button type="button" className="admin-btn-primary" disabled={insideBusy} onClick={() => void saveInsideBackground()}>
            {insideBusy ? 'Saving…' : 'Save What\'s Inside background'}
          </button>
        </div>
      ) : (
        <p className="admin-muted mt-6 text-sm">No active What&apos;s Inside row found in the database.</p>
      )}

      <AdminModal
        open={!!draft}
        onOpenChange={(open) => !open && setDraft(null)}
        title="Edit hero"
        wide
        footer={
          <>
            <button type="button" className="admin-btn-secondary" onClick={() => setDraft(null)}>
              Cancel
            </button>
            <button type="button" className="admin-btn-primary" onClick={() => void save()}>
              Save
            </button>
          </>
        }
      >
        {draft ? (
          <div className="grid gap-4 md:grid-cols-2">
            {(['title_line1', 'title_line2', 'title_line3', 'highlight_word'] as const).map((field) => (
              <label key={field} className="block space-y-2">
                <span className="admin-label capitalize">{field.replaceAll('_', ' ')}</span>
                <input className="admin-input" value={(draft[field] as string) ?? ''} onChange={(e) => setDraft({ ...draft, [field]: e.target.value })} />
              </label>
            ))}
            <label className="block space-y-2 md:col-span-2">
              <span className="admin-label">Description</span>
              <textarea className="admin-input min-h-24" value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </label>
            <div className="space-y-4 md:col-span-2">
              <p className="admin-muted text-sm">
                Upload separate backgrounds per breakpoint. Desktop is required; tablet and mobile fall back to the next larger size when empty.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <ImageUploadField
                  label="Desktop background"
                  folder="hero"
                  value={draft.image_url ?? ''}
                  onChange={(v) => setDraft({ ...draft, image_url: v })}
                />
                <ImageUploadField
                  label="Tablet background"
                  folder="hero"
                  value={draft.image_url_tablet ?? ''}
                  onChange={(v) => setDraft({ ...draft, image_url_tablet: v })}
                />
                <ImageUploadField
                  label="Mobile background"
                  folder="hero"
                  value={draft.image_url_mobile ?? ''}
                  onChange={(v) => setDraft({ ...draft, image_url_mobile: v })}
                />
              </div>
            </div>
            <label className="block space-y-2">
              <span className="admin-label">Primary CTA label</span>
              <input className="admin-input" value={draft.primary_cta_label ?? ''} onChange={(e) => setDraft({ ...draft, primary_cta_label: e.target.value })} />
            </label>
            <label className="block space-y-2">
              <span className="admin-label">Primary CTA URL</span>
              <input className="admin-input" value={draft.primary_cta_url ?? ''} onChange={(e) => setDraft({ ...draft, primary_cta_url: e.target.value })} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.is_active ?? true} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} />
              Active
            </label>
            {saveErr ? <p className="text-sm text-red-400 md:col-span-2">{saveErr}</p> : null}
          </div>
        ) : null}
      </AdminModal>
    </div>
  )
}
