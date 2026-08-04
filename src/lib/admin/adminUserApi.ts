import { getSupabase } from '#/integrations/supabase/client'

export type AdminRole = 'owner' | 'admin' | 'editor' | 'viewer' | 'office_admin'
export type SignupAdminRole = 'owner' | 'admin'

export type AdminProfile = {
  role: AdminRole
  is_active: boolean
}

/** Full CMS access (content, donations, settings). */
export function canAccessCms(profile: AdminProfile | null) {
  return Boolean(
    profile?.is_active &&
      (profile.role === 'owner' || profile.role === 'admin' || profile.role === 'editor'),
  )
}

/** Submissions inbox (includes office admin). */
export function canAccessSubmissions(profile: AdminProfile | null) {
  return Boolean(
    profile?.is_active &&
      (profile.role === 'owner' ||
        profile.role === 'admin' ||
        profile.role === 'editor' ||
        profile.role === 'office_admin'),
  )
}

export function isOfficeAdmin(profile: AdminProfile | null) {
  return Boolean(profile?.is_active && profile.role === 'office_admin')
}

export async function canBootstrapAdmin() {
  const sb = getSupabase()
  if (!sb) return false

  const { data, error } = await sb.rpc('dq_can_bootstrap_admin')
  if (error) {
    console.error('canBootstrapAdmin', error)
    return false
  }

  return Boolean(data)
}

export async function registerAdminUser(role: SignupAdminRole) {
  const sb = getSupabase()
  if (!sb) return { error: 'Supabase is not configured.' }

  const { error } = await sb.rpc('dq_register_admin_user', { p_role: role })
  return error ? { error: error.message } : {}
}

export async function fetchAdminProfile() {
  const sb = getSupabase()
  if (!sb) return null

  const { data, error } = await sb.rpc('dq_get_my_admin_profile')

  if (error) {
    console.error('fetchAdminProfile', error)
    return null
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object') return null

  return row as AdminProfile
}

export function canManageAdmins(profile: AdminProfile | null) {
  return Boolean(profile?.is_active && (profile.role === 'owner' || profile.role === 'admin'))
}
