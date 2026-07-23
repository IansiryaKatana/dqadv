import { getSupabaseAdmin, getSupabaseUserClient } from '#/lib/integrations/supabaseAdmin'

export async function verifyAdminAccess(accessToken: string) {
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
  if (adminRow.role !== 'owner' && adminRow.role !== 'admin' && adminRow.role !== 'editor') {
    throw new Error('Unauthorized')
  }

  return userData.user
}
