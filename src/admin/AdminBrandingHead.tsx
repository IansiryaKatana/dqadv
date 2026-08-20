import { BrandingHead } from '#/components/layout/BrandingHead'
import { useAdminBrandSettings } from './useAdminBrandSettings'

export function AdminBrandingHead() {
  const settings = useAdminBrandSettings()
  return <BrandingHead siteSettings={settings} faviconUrl={settings.favicon_url} />
}
