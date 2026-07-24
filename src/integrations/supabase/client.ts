import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { readPublicSupabaseEnv } from './env'

let client: SupabaseClient<Database> | null = null
let clientUrl: string | null = null
let clientKey: string | null = null

export function getSupabase() {
  // Read per call — Cloudflare injects env at request time (not module load).
  const { url, key } = readPublicSupabaseEnv()

  if (!url || !key) return null

  if (!client || clientUrl !== url || clientKey !== key) {
    client = createClient<Database>(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
    clientUrl = url
    clientKey = key
  }

  return client
}

export function isSupabaseConfigured() {
  const { url, key } = readPublicSupabaseEnv()
  return Boolean(url && key)
}
