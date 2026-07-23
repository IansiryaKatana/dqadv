export const SITE_NAME = 'Donate Quran'

export function siteTitle(page?: string) {
  return page ? `${page} — ${SITE_NAME}` : SITE_NAME
}
