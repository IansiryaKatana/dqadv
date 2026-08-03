import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'
import { readServerSupabaseEnv } from '#/integrations/supabase/env'
import type { AdminRole } from './adminUserApi'

type AccessInput = { accessToken: string }

type UpdateAdminUserInput = {
  accessToken: string
  id: string
  role?: AdminRole
  isActive?: boolean
}

const ALLOWED_ROLES = new Set<AdminRole>(['owner', 'admin', 'editor', 'viewer'])

function getClients(accessToken: string) {
  const { url, anonKey, serviceKey } = readServerSupabaseEnv()
  if (!url || !anonKey || !serviceKey) {
    throw new Error('Server Supabase configuration is missing SUPABASE_SERVICE_ROLE_KEY.')
  }

  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })

  const adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return { userClient, adminClient }
}

async function requireManager(accessToken: string) {
  const { userClient, adminClient } = getClients(accessToken)
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) throw new Error('Unauthorized')

  const { data: adminRow, error: adminError } = await adminClient
    .from('dq_admin_users')
    .select('id, role, is_active')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle()

  if (adminError || !adminRow?.is_active) throw new Error('Unauthorized')
  if (adminRow.role !== 'owner' && adminRow.role !== 'admin') {
    throw new Error('Only owners and admins can manage admin accounts.')
  }

  return {
    adminClient,
    actor: {
      authUserId: userData.user.id,
      role: adminRow.role as AdminRole,
      rowId: adminRow.id as string,
    },
  }
}

export const listAdminUsers = createServerFn({ method: 'POST' })
  .validator((data: AccessInput) => data)
  .handler(async ({ data }) => {
    const { adminClient } = await requireManager(data.accessToken)
    const { data: rows, error } = await adminClient
      .from('dq_admin_users')
      .select('id, email, role, is_active, created_at, auth_user_id')
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)
    return (rows ?? []) as Array<{
      id: string
      email: string
      role: AdminRole
      is_active: boolean
      created_at: string | null
      auth_user_id: string | null
    }>
  })

export const updateAdminUser = createServerFn({ method: 'POST' })
  .validator((data: UpdateAdminUserInput) => data)
  .handler(async ({ data }) => {
    const { adminClient, actor } = await requireManager(data.accessToken)

    if (data.role != null && !ALLOWED_ROLES.has(data.role)) {
      throw new Error('Invalid admin role.')
    }
    if (data.role === 'owner' && actor.role !== 'owner') {
      throw new Error('Only owners can assign the owner role.')
    }

    const { data: target, error: targetError } = await adminClient
      .from('dq_admin_users')
      .select('id, auth_user_id, role, is_active')
      .eq('id', data.id)
      .maybeSingle()

    if (targetError || !target) throw new Error('Admin user not found.')

    const isSelf = target.auth_user_id === actor.authUserId
    if (isSelf && data.isActive === false) {
      throw new Error('You cannot deactivate your own account.')
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.role != null) patch.role = data.role
    if (data.isActive != null) patch.is_active = data.isActive

    const { error } = await adminClient.from('dq_admin_users').update(patch).eq('id', data.id)
    if (error) throw new Error(error.message)

    return { success: true as const }
  })
