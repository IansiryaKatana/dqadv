import { getSupabaseAdmin } from '#/lib/integrations/supabaseAdmin'
import { DEFAULT_BRAND_COLORS, resolveHexColor } from '#/lib/site/branding'

export async function loadEmailBrandGold() {
  const admin = getSupabaseAdmin()
  if (!admin) return DEFAULT_BRAND_COLORS.gold

  const { data } = await admin.from('dq_site_settings').select('value').eq('key', 'primary_color').maybeSingle()
  return resolveHexColor(data?.value, DEFAULT_BRAND_COLORS.gold)
}
