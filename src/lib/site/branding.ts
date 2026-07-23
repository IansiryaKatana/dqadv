export const DEFAULT_LOGO_LIGHT = '/images/logo-light.png'
export const DEFAULT_LOGO_DARK = '/images/logo-dark.png'
export const DEFAULT_FAVICON = '/favicon.png'

export function resolveLogoLight(url?: string) {
  const value = url?.trim()
  return value || DEFAULT_LOGO_LIGHT
}

export function resolveLogoDark(url?: string) {
  const value = url?.trim()
  return value || DEFAULT_LOGO_DARK
}

export function resolveFavicon(url?: string) {
  const value = url?.trim()
  return value || DEFAULT_FAVICON
}
