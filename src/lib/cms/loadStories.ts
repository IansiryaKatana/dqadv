import staticCms from '#/data/static-cms.json'
import { getSupabase } from '#/integrations/supabase/client'
import type { StoryPoster } from './types'

export async function loadAllStories(): Promise<StoryPoster[]> {
  const sb = getSupabase()
  if (!sb) return staticCms.stories

  try {
    const { data, error } = await sb
      .from('dq_story_posters')
      .select('*')
      .eq('is_active', true)
      .eq('published', true)
      .order('sort_order')

    if (error || !data?.length) return staticCms.stories

    return data.map((r) => ({
      id: r.id,
      title: r.title,
      imageUrl: r.image_url,
      videoUrl: r.video_url,
      linkUrl: r.link_url,
      sortOrder: r.sort_order,
    }))
  } catch {
    return staticCms.stories
  }
}

export async function loadStoryBySlug(slug: string): Promise<StoryPoster | null> {
  const stories = await loadAllStories()
  return stories.find((s) => (s.linkUrl ?? '').endsWith(`/${slug}`) || s.linkUrl === `/stories/${slug}`) ?? null
}
