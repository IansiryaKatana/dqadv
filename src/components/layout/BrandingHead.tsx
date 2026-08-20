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
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }

    link.href = href

    if (href.endsWith('.svg')) {
      link.type = 'image/svg+xml'
    } else if (href.endsWith('.ico')) {
      link.type = 'image/x-icon'
    } else {
      link.type = 'image/png'
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
