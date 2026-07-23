import { useEffect } from 'react'
import { resolveFavicon } from '#/lib/site/branding'

type BrandingHeadProps = {
  faviconUrl?: string
}

export function BrandingHead({ faviconUrl }: BrandingHeadProps) {
  const href = resolveFavicon(faviconUrl)

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

  return null
}
