import { getSupabaseAdmin } from '#/lib/integrations/supabaseAdmin'
import type { User } from '@supabase/supabase-js'

type AdminRow = { role: string; is_active: boolean }

const CMS_ROLES = new Set(['owner', 'admin', 'editor'])
const OFFICE_OPS_ROLES = new Set(['owner', 'admin', 'editor', 'office_admin'])

async function loadActiveAdmin(accessToken: string) {
  const token = accessToken?.trim()
  if (!token) throw new Error('Your session expired. Sign in again.')

  const admin = getSupabaseAdmin()
  if (!admin) throw new Error('Server configuration is missing.')

  // Prefer service-role JWT validation (reliable on Workers; no anon client needed).
  const { data: userData, error: userError } = await admin.auth.getUser(token)
  if (userError || !userData.user) throw new Error('Your session expired. Sign in again.')

  const { data: adminRow, error: adminError } = await admin
    .from('dq_admin_users')
    .select('role, is_active')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle()

  if (adminError) throw new Error(`Could not verify admin access: ${adminError.message}`)
  if (!adminRow?.is_active) throw new Error('This account is not an active admin.')

  return { user: userData.user as User, adminRow: adminRow as AdminRow }
}

/** Full CMS: owner / admin / editor. */
export async function verifyAdminAccess(accessToken: string) {
  const { user, adminRow } = await loadActiveAdmin(accessToken)
  if (!CMS_ROLES.has(adminRow.role)) {
    throw new Error('This action requires a CMS admin role.')
  }
  return user
}

/** Form submissions + replies: CMS roles or office_admin. */
export async function verifySubmissionsAccess(accessToken: string) {
  const { user, adminRow } = await loadActiveAdmin(accessToken)
  if (!OFFICE_OPS_ROLES.has(adminRow.role)) {
    throw new Error('Your role cannot manage form submissions.')
  }
  return user
}

/** Donations inbox + fulfillment: CMS roles or office_admin. */
export async function verifyDonationsAccess(accessToken: string) {
  const { user, adminRow } = await loadActiveAdmin(accessToken)
  if (!OFFICE_OPS_ROLES.has(adminRow.role)) {
    throw new Error('Your role cannot manage donations.')
  }
  return user
}
