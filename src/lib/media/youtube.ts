export function extractYouTubeVideoId(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  const patterns = [
    /youtube\.com\/shorts\/([^?&/]+)/,
    /youtube\.com\/embed\/([^?&/]+)/,
    /youtube\.com\/watch\?v=([^?&/]+)/,
    /youtu\.be\/([^?&/]+)/,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

export function isYouTubeUrl(url: string) {
  return extractYouTubeVideoId(url) !== null
}

/** True when the poster was auto-filled from YouTube CDN (not a custom upload). */
export function isAutoYouTubePoster(url: string | null | undefined) {
  if (!url?.trim()) return false
  return url.includes('i.ytimg.com/vi/') || url.includes('img.youtube.com/vi/')
}

/** Snapshot uploaded by our server on story save (`story-posters/yt-…`). */
export function isGeneratedYouTubeSnapshot(url: string | null | undefined) {
  if (!url?.trim()) return false
  return /\/story-posters\/yt-[^/?#]+/i.test(url)
}

/** Managed posters that should be regenerated on every YouTube story save. */
export function isManagedStoryPoster(url: string | null | undefined) {
  return isAutoYouTubePoster(url) || isGeneratedYouTubeSnapshot(url)
}

/**
 * YouTube CDN thumbnail URL (fallback only — prefer stored snapshots).
 * `cacheKey` busts browser cache when the story video URL changes.
 */
export function youTubeThumbnailUrl(
  videoId: string,
  variant: 'oar' | 'hq' | 'maxres' | 'sd' | 'mq' = 'hq',
  cacheKey?: string,
) {
  const file =
    variant === 'oar'
      ? 'oardefault.jpg'
      : variant === 'maxres'
        ? 'maxresdefault.jpg'
        : variant === 'sd'
          ? 'sddefault.jpg'
          : variant === 'mq'
            ? 'mqdefault.jpg'
            : 'hqdefault.jpg'
  const base = `https://i.ytimg.com/vi/${videoId}/${file}`
  if (!cacheKey) return base
  return `${base}?v=${encodeURIComponent(cacheKey)}`
}

/** Candidate CDN URLs to try when generating a stored snapshot. */
export function youTubeThumbnailCandidates(videoId: string) {
  return (['maxres', 'hq', 'sd', 'mq', 'oar'] as const).map((variant) =>
    youTubeThumbnailUrl(videoId, variant),
  )
}

export function resolveStoryPosterUrl(story: { imageUrl: string; videoUrl?: string | null }) {
  const stored = story.imageUrl?.trim()
  if (stored) return stored

  const videoUrl = story.videoUrl?.trim() || ''
  const youTubeId = videoUrl ? extractYouTubeVideoId(videoUrl) : null
  if (youTubeId) return youTubeThumbnailUrl(youTubeId, 'hq', videoUrl)
  return ''
}

/**
 * Client-side poster resolution for non-YouTube / custom cases.
 * YouTube stories should call `generateStoryPosterSnapshot` on save instead.
 */
export function resolveStoryPosterForSave(videoUrl: string, imageUrl?: string | null) {
  const youTubeId = extractYouTubeVideoId(videoUrl)
  const customPoster = imageUrl?.trim() || ''

  if (youTubeId) {
    if (customPoster && !isManagedStoryPoster(customPoster)) return customPoster
    return youTubeThumbnailUrl(youTubeId, 'hq', videoUrl)
  }

  return customPoster
}

type YouTubeEmbedOptions = {
  autoplay?: boolean
  controls?: boolean
  loop?: boolean
  mute?: boolean
}

export function youTubeEmbedUrl(videoId: string, options: YouTubeEmbedOptions = {}) {
  const { autoplay = false, controls = true, loop = false, mute = true } = options
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: mute ? '1' : '0',
    controls: controls ? '1' : '0',
    playsinline: '1',
    modestbranding: '1',
    rel: '0',
  })

  if (loop) {
    params.set('loop', '1')
    params.set('playlist', videoId)
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}
