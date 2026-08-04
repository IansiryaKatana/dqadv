import { getSupabaseAdmin, getSupabaseUserClient } from '#/lib/integrations/supabaseAdmin'

type AdminRow = { role: string; is_active: boolean }

async function loadActiveAdmin(accessToken: string) {
  const userClient = getSupabaseUserClient(accessToken)
  if (!userClient) throw new Error('Server configuration is missing.')

  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) throw new Error('Unauthorized')

  const admin = getSupabaseAdmin()
  if (!admin) throw new Error('Server configuration is missing.')

  const { data: adminRow, error: adminError } = await admin
    .from('dq_admin_users')
    .select('role, is_active')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle()

  if (adminError || !adminRow?.is_active) throw new Error('Unauthorized')

  return { user: userData.user, adminRow: adminRow as AdminRow }
}

/** Full CMS: owner / admin / editor. */
export async function verifyAdminAccess(accessToken: string) {
  const { user, adminRow } = await loadActiveAdmin(accessToken)
  if (adminRow.role !== 'owner' && adminRow.role !== 'admin' && adminRow.role !== 'editor') {
    throw new Error('Unauthorized')
  }
  return user
}

/** Form submissions + replies: CMS roles or office_admin. */
export async function verifySubmissionsAccess(accessToken: string) {
  const { user, adminRow } = await loadActiveAdmin(accessToken)
  if (
    adminRow.role !== 'owner' &&
    adminRow.role !== 'admin' &&
    adminRow.role !== 'editor' &&
    adminRow.role !== 'office_admin'
  ) {
    throw new Error('Unauthorized')
  }
  return user
}
