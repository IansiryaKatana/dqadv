import { useEffect, useState } from 'react'
import { getSupabase } from '#/integrations/supabase/client'
import { BrandingHead } from '#/components/layout/BrandingHead'

export function AdminBrandingHead() {
  const [settings, setSettings] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) {
      setSettings({})
      return
    }

    void sb.from('dq_site_settings').select('key, value').then(({ data }) => {
      const rows = (data ?? []) as { key: string; value: string }[]
      setSettings(Object.fromEntries(rows.map((row) => [row.key, row.value])))
    })
  }, [])

  if (!settings) return null
  return <BrandingHead siteSettings={settings} faviconUrl={settings.favicon_url} />
}
