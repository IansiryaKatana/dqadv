import { createServerFn } from '@tanstack/react-start'
import staticEditions from '#/data/static-quran-editions.json'
import { getSupabase } from '#/integrations/supabase/client'
import type { QuranEdition } from './types'

function mapRow(r: Record<string, unknown>): QuranEdition {
  return {
    id: r.id as string,
    slug: r.slug as string,
    language: r.language as string,
    featuredImageUrl: r.featured_image_url as string,
    pdfUrl: (r.pdf_url as string) ?? null,
    sortOrder: r.sort_order as number,
  }
}

async function fetchQuranEditions(): Promise<QuranEdition[]> {
  const sb = getSupabase()
  if (!sb) return staticEditions as QuranEdition[]

  try {
    const { data, error } = await sb
      .from('dq_quran_editions')
      .select('*')
      .eq('is_active', true)
      .eq('published', true)
      .order('sort_order')

    if (error || !data?.length) return staticEditions as QuranEdition[]
    return data.map((r) => mapRow(r))
  } catch {
    return staticEditions as QuranEdition[]
  }
}

export const loadQuranEditions = createServerFn({ method: 'POST', strict: false }).handler(async () =>
  fetchQuranEditions(),
)

export const loadQuranEditionBySlug = createServerFn({ method: 'POST', strict: false })
  .validator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const editions = await fetchQuranEditions()
    return editions.find((e) => e.slug === data.slug) ?? null
  })
