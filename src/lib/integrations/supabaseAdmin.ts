import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readServerSupabaseEnv } from '#/integrations/supabase/env'

export function getSupabaseAdmin(): SupabaseClient | null {
  const { url, serviceKey } = readServerSupabaseEnv()
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function getSupabaseUserClient(accessToken: string) {
  const { url, anonKey } = readServerSupabaseEnv()
  if (!url || !anonKey) return null
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}
