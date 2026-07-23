import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

let client: SupabaseClient<Database> | null = null

function readSupabaseEnv() {
  const fromProcess =
    typeof process !== 'undefined'
      ? {
          url: process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL,
          key: process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY,
        }
      : { url: undefined, key: undefined }

  return {
    // Vite inlines import.meta.env at build time; process.env covers SSR/runtime hosts.
    url: (import.meta.env.VITE_SUPABASE_URL as string | undefined) || fromProcess.url,
    key: (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || fromProcess.key,
  }
}

export function getSupabase() {
  const { url, key } = readSupabaseEnv()

  if (!url || !key) return null

  if (!client) {
    client = createClient<Database>(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }

  return client
}

export function isSupabaseConfigured() {
  const { url, key } = readSupabaseEnv()
  return Boolean(url && key)
}
