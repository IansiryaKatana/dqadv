import { useEffect } from 'react'
import {
  applyBrandTheme,
  resolveBrandTheme,
  resolveFavicon,
  type BrandTheme,
} from '#/lib/site/branding'

type BrandingHeadProps = {
  faviconUrl?: string
  siteSettings?: Record<string, string>
}

export function BrandingHead({ faviconUrl, siteSettings }: BrandingHeadProps) {
  const href = resolveFavicon(faviconUrl ?? siteSettings?.favicon_url)
  const theme = resolveBrandTheme(siteSettings)
  const themeKey = brandThemeKey(theme)

  useEffect(() => {
    const type = href.endsWith('.svg')
      ? 'image/svg+xml'
      : href.endsWith('.ico')
        ? 'image/x-icon'
        : 'image/png'

    const links = document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']")
    if (links.length === 0) {
      const link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
      link.href = href
      link.type = type
      return
    }

    for (const link of links) {
      link.href = href
      link.type = type
    }
  }, [href])

  useEffect(() => {
    applyBrandTheme(resolveBrandTheme(siteSettings))
  }, [themeKey, siteSettings])

  return null
}

function brandThemeKey(theme: BrandTheme) {
  return [
    theme.gold,
    theme.onGold,
    theme.black,
    theme.softBlack,
    theme.cream,
    theme.muted,
    theme.border,
    theme.fontFamily,
    theme.fontFileUrl,
  ].join('|')
}
