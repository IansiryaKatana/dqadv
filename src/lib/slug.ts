export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/['']/g, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Keep the existing slug when the source label is unchanged; otherwise derive a new one. */
export function resolveSlugFromLabel(label: string, previousLabel?: string, previousSlug?: string): string {
  const next = slugify(label)
  if (!next) return previousSlug ?? ''
  if (previousLabel && previousSlug && label.trim() === previousLabel.trim()) {
    return previousSlug
  }
  return next
}
