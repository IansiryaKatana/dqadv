import { createIsomorphicFn } from '@tanstack/react-start'

export type PublicSupabaseEnv = {
  url: string | undefined
  key: string | undefined
}

function readProcessPublicEnv(): PublicSupabaseEnv {
  if (typeof process === 'undefined') return { url: undefined, key: undefined }
  return {
    url: process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL,
    key: process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY,
  }
}

/**
 * Public Supabase credentials.
 * - Server/SSR: process.env (Cloudflare Workers populates these per-request with
 *   nodejs_compat + nodejs_compat_populate_process_env)
 * - Client: Vite-inlined VITE_* only
 *
 * Always call from a request path (loader / createServerFn), never at module scope.
 */
export const readPublicSupabaseEnv = createIsomorphicFn()
  .server((): PublicSupabaseEnv => readProcessPublicEnv())
  .client((): PublicSupabaseEnv => ({
    url: import.meta.env.VITE_SUPABASE_URL as string | undefined,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  }))

/** Server-only secrets + public URL for admin/service clients. */
export function readServerSupabaseEnv() {
  const publicEnv = readProcessPublicEnv()
  return {
    url: publicEnv.url,
    anonKey: publicEnv.key,
    serviceKey: typeof process !== 'undefined' ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined,
  }
}
