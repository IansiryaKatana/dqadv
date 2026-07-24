import { createServerFn } from '@tanstack/react-start'
import staticVideos from '#/data/static-videos.json'
import { getSupabase } from '#/integrations/supabase/client'
import type { FeaturedVideo } from './types'

function mapRow(r: Record<string, unknown>): FeaturedVideo {
  return {
    id: r.id as string,
    slug: r.slug as string,
    title: r.title as string,
    description: r.description as string,
    thumbnailUrl: r.thumbnail_url as string,
    videoType: r.video_type as 'upload' | 'youtube',
    videoUrl: r.video_url as string,
    duration: (r.duration as string) ?? null,
    sortOrder: r.sort_order as number,
  }
}

async function fetchFeaturedVideos(): Promise<FeaturedVideo[]> {
  const sb = getSupabase()
  if (!sb) return staticVideos as FeaturedVideo[]

  try {
    const { data, error } = await sb
      .from('dq_featured_videos')
      .select('*')
      .eq('is_active', true)
      .eq('published', true)
      .order('sort_order')

    if (error || !data?.length) return staticVideos as FeaturedVideo[]
    return data.map((r) => mapRow(r))
  } catch {
    return staticVideos as FeaturedVideo[]
  }
}

export const loadFeaturedVideos = createServerFn({ method: 'POST', strict: false }).handler(async () =>
  fetchFeaturedVideos(),
)

export const loadFeaturedVideoBySlug = createServerFn({ method: 'POST', strict: false })
  .validator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const videos = await fetchFeaturedVideos()
    return videos.find((v) => v.slug === data.slug) ?? null
  })
