import { useEffect, useRef, useState } from 'react'
import { getSupabase } from '#/integrations/supabase/client'
import { BRAND_SETTINGS_EVENT } from '#/lib/site/branding'

export function useAdminBrandSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const loadId = useRef(0)

  useEffect(() => {
    const sb = getSupabase()
    const id = ++loadId.current
    if (!sb) return

    void sb.from('dq_site_settings').select('key, value').then(({ data }) => {
      if (id !== loadId.current) return
      const rows = (data ?? []) as { key: string; value: string }[]
      setSettings(Object.fromEntries(rows.map((row) => [row.key, row.value])))
    })
  }, [])

  useEffect(() => {
    function onSaved(event: Event) {
      const detail = (event as CustomEvent<Record<string, string>>).detail
      if (!detail) return
      loadId.current += 1
      setSettings(detail)
    }
    window.addEventListener(BRAND_SETTINGS_EVENT, onSaved)
    return () => window.removeEventListener(BRAND_SETTINGS_EVENT, onSaved)
  }, [])

  return settings
}
