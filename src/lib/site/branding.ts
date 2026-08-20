export const DEFAULT_LOGO_LIGHT = '/images/logo-light.png'
export const DEFAULT_LOGO_DARK = '/images/logo-dark.png'
export const DEFAULT_FAVICON = '/favicon.png'

export const DEFAULT_BRAND_COLORS = {
  gold: '#f4b000',
  onGold: '#050505',
  black: '#050505',
  softBlack: '#111111',
  cream: '#f8f3ea',
  muted: '#6f6f6f',
  border: '#e8e2d6',
} as const

export const ON_GOLD_PRESETS = {
  black: '#050505',
  white: '#ffffff',
} as const

export const DEFAULT_FONT_FAMILY = 'Pliant'

export type BrandTheme = {
  gold: string
  onGold: string
  black: string
  softBlack: string
  cream: string
  muted: string
  border: string
  fontFamily: string
  fontFileUrl: string
}

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
const FONT_STYLE_ID = 'dq-brand-font-face'
const FONT_LINK_ID = 'dq-brand-google-font'

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

export function resolveHexColor(value?: string | null, fallback: string = DEFAULT_BRAND_COLORS.gold) {
  const trimmed = value?.trim()
  if (trimmed && HEX_RE.test(trimmed)) return normalizeHex(trimmed)
  if (fallback && HEX_RE.test(fallback)) return normalizeHex(fallback)
  return DEFAULT_BRAND_COLORS.gold
}

export function toColorInputValue(value: string, fallback: string) {
  return resolveHexColor(value, fallback)
}

export function resolveFontFamily(value?: string | null) {
  const family = value?.trim()
  return family || DEFAULT_FONT_FAMILY
}

export function resolveBrandTheme(settings?: Record<string, string> | null): BrandTheme {
  const s = settings ?? {}
  return {
    gold: resolveHexColor(s.primary_color, DEFAULT_BRAND_COLORS.gold),
    onGold: resolveHexColor(s.primary_foreground, DEFAULT_BRAND_COLORS.onGold),
    black: resolveHexColor(s.color_black, DEFAULT_BRAND_COLORS.black),
    softBlack: resolveHexColor(s.color_soft_black, DEFAULT_BRAND_COLORS.softBlack),
    cream: resolveHexColor(s.color_cream, DEFAULT_BRAND_COLORS.cream),
    muted: resolveHexColor(s.color_muted, DEFAULT_BRAND_COLORS.muted),
    border: resolveHexColor(s.color_border, DEFAULT_BRAND_COLORS.border),
    fontFamily: resolveFontFamily(s.font_family),
    fontFileUrl: s.font_file_url?.trim() ?? '',
  }
}

export function googleFontsStylesheetUrl(family: string) {
  const encoded = encodeURIComponent(family.trim() || DEFAULT_FONT_FAMILY).replaceAll('%20', '+')
  return `https://fonts.googleapis.com/css2?family=${encoded}:wght@100;200;300;400&display=swap`
}

export function cssFontFamilyStack(family: string) {
  const safe = sanitizeFontFamily(family)
  return `"${safe}", ui-sans-serif, system-ui, sans-serif`
}

export function applyBrandTheme(theme: BrandTheme) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.style.setProperty('--dq-gold', theme.gold)
  root.style.setProperty('--dq-on-gold', theme.onGold)
  root.style.setProperty('--dq-black', theme.black)
  root.style.setProperty('--dq-soft-black', theme.softBlack)
  root.style.setProperty('--dq-cream', theme.cream)
  root.style.setProperty('--dq-muted', theme.muted)
  root.style.setProperty('--dq-border', theme.border)
  root.style.setProperty('--dq-font-family', cssFontFamilyStack(theme.fontFamily))

  document.getElementById(FONT_STYLE_ID)?.remove()
  document.getElementById(FONT_LINK_ID)?.remove()

  const family = sanitizeFontFamily(theme.fontFamily)

  if (theme.fontFileUrl) {
    const style = document.createElement('style')
    style.id = FONT_STYLE_ID
    const format = fontFormat(theme.fontFileUrl)
    style.textContent = `@font-face{font-family:"${family}";src:url(${JSON.stringify(theme.fontFileUrl)}) format("${format}");font-weight:100 400;font-style:normal;font-display:swap;}`
    document.head.appendChild(style)
    return
  }

  const link = document.createElement('link')
  link.id = FONT_LINK_ID
  link.rel = 'stylesheet'
  link.href = googleFontsStylesheetUrl(family)
  document.head.appendChild(link)
}

export const BRAND_SETTINGS_EVENT = 'dq-brand-settings'

export function publishBrandSettings(settings: Record<string, string>) {
  applyBrandTheme(resolveBrandTheme(settings))
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(BRAND_SETTINGS_EVENT, { detail: settings }))
}

export function contrastRatio(background: string, foreground: string) {
  const bg = relativeLuminance(resolveHexColor(background, DEFAULT_BRAND_COLORS.gold))
  const fg = relativeLuminance(resolveHexColor(foreground, DEFAULT_BRAND_COLORS.onGold))
  const lighter = Math.max(bg, fg)
  const darker = Math.min(bg, fg)
  return (lighter + 0.05) / (darker + 0.05)
}

export function hasReadableContrast(background: string, foreground: string, minimum = 4.5) {
  return contrastRatio(background, foreground) >= minimum
}

function relativeLuminance(hex: string) {
  const value = hex.replace('#', '')
  const r = channelLuminance(Number.parseInt(value.slice(0, 2), 16) / 255)
  const g = channelLuminance(Number.parseInt(value.slice(2, 4), 16) / 255)
  const b = channelLuminance(Number.parseInt(value.slice(4, 6), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function channelLuminance(channel: number) {
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

function normalizeHex(hex: string) {
  if (hex.length === 4) {
    const r = hex[1]
    const g = hex[2]
    const b = hex[3]
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return hex.toLowerCase()
}

function sanitizeFontFamily(family: string) {
  return (family.trim() || DEFAULT_FONT_FAMILY).replace(/["\\]/g, '')
}

function fontFormat(url: string) {
  const path = url.split('?')[0]?.toLowerCase() ?? ''
  if (path.endsWith('.woff2')) return 'woff2'
  if (path.endsWith('.woff')) return 'woff'
  if (path.endsWith('.otf')) return 'opentype'
  return 'truetype'
}
