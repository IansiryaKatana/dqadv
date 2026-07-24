import { createServerFn } from '@tanstack/react-start'
import staticTrust from '#/data/static-trust.json'
import { getSupabase } from '#/integrations/supabase/client'
import type { TrustBlock, TrustContent } from './types'

function indexBlocks(blocks: TrustBlock[]): TrustContent {
  const byKey: Record<string, TrustBlock> = {}
  for (const block of blocks) byKey[block.key] = block
  return { blocks, byKey }
}

function staticTrustContent(): TrustContent {
  return indexBlocks(staticTrust.blocks as TrustBlock[])
}

async function fetchTrustContent(): Promise<TrustContent> {
  const sb = getSupabase()
  if (!sb) return staticTrustContent()

  try {
    const { data, error } = await sb
      .from('dq_trust_blocks')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (error || !data?.length) return staticTrustContent()

    return indexBlocks(
      data.map((r) => ({
        id: r.id,
        key: r.key,
        title: r.title,
        bodyHtml: r.body_html,
        extra: (r.extra as Record<string, unknown>) ?? {},
        sortOrder: r.sort_order,
      })),
    )
  } catch {
    return staticTrustContent()
  }
}

export const loadTrustContent = createServerFn({ method: 'POST', strict: false }).handler(async () =>
  fetchTrustContent(),
)

export function getTrustBlock(trust: TrustContent, key: string): TrustBlock | undefined {
  return trust.byKey[key]
}
