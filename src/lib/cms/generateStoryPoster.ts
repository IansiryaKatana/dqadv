import { createServerFn } from '@tanstack/react-start'
import { verifyAdminAccess } from '#/lib/admin/verifyAdminAccess'
import { getSupabaseAdmin } from '#/lib/integrations/supabaseAdmin'
import { CMS_MEDIA_BUCKET } from '#/lib/cms/uploadMedia'
import { extractYouTubeVideoId, youTubeThumbnailCandidates } from '#/lib/media/youtube'

const MIN_THUMB_BYTES = 2_000

async function fetchBestYouTubeThumbnail(videoId: string) {
  for (const url of youTubeThumbnailCandidates(videoId)) {
    try {
      const res = await fetch(url, { redirect: 'follow' })
      if (!res.ok) continue
      const buffer = Buffer.from(await res.arrayBuffer())
      if (buffer.byteLength < MIN_THUMB_BYTES) continue
      const contentType = res.headers.get('content-type') || 'image/jpeg'
      if (!contentType.startsWith('image/')) continue
      return { buffer, contentType, sourceUrl: url }
    } catch {
      // try next candidate
    }
  }
  return null
}

export const generateStoryPosterSnapshot = createServerFn({ method: 'POST' })
  .validator((data: { accessToken: string; videoUrl: string }) => data)
  .handler(async ({ data }) => {
    await verifyAdminAccess(data.accessToken)

    const videoUrl = data.videoUrl.trim()
    const videoId = extractYouTubeVideoId(videoUrl)
    if (!videoId) {
      throw new Error('A valid YouTube URL is required to generate a snapshot.')
    }

    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('Server configuration is missing.')

    const thumb = await fetchBestYouTubeThumbnail(videoId)
    if (!thumb) {
      throw new Error('Could not download a YouTube thumbnail for this video.')
    }

    const ext = thumb.contentType.includes('png') ? 'png' : 'jpg'
    const path = `story-posters/yt-${videoId}-${Date.now()}.${ext}`

    const { error } = await admin.storage.from(CMS_MEDIA_BUCKET).upload(path, thumb.buffer, {
      cacheControl: '3600',
      upsert: false,
      contentType: thumb.contentType,
    })
    if (error) throw new Error(error.message)

    const { data: publicData } = admin.storage.from(CMS_MEDIA_BUCKET).getPublicUrl(path)
    return { publicUrl: publicData.publicUrl, sourceUrl: thumb.sourceUrl }
  })
