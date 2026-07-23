import { getSupabase } from '#/integrations/supabase/client'

export const CMS_MEDIA_BUCKET = 'dq-cms-media'

export async function uploadCmsMedia(file: File, folder: string) {
  const sb = getSupabase()
  if (!sb) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }

  const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'jpg'
  const path = `${folder.replace(/^\/+|\/+$/g, '')}/${crypto.randomUUID()}.${extension}`

  const { error } = await sb.storage.from(CMS_MEDIA_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  })

  if (error) throw error

  const { data } = sb.storage.from(CMS_MEDIA_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
