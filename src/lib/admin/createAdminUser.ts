import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'
import { readServerSupabaseEnv } from '#/integrations/supabase/env'

type CreateAdminUserInput = {
  email: string
  password: string
  role: 'owner' | 'admin'
  accessToken: string
}

function getServerSupabaseConfig() {
  const { url, anonKey, serviceKey } = readServerSupabaseEnv()
  return { url, anonKey, serviceKey }
}

export const createAdminUser = createServerFn({ method: 'POST' })
  .validator((data: CreateAdminUserInput) => data)
  .handler(async ({ data }) => {
    const { url, anonKey, serviceKey } = getServerSupabaseConfig()

    if (!url || !anonKey || !serviceKey) {
      throw new Error('Server Supabase configuration is missing SUPABASE_SERVICE_ROLE_KEY.')
    }

    const email = data.email.trim().toLowerCase()
    if (!email || data.password.length < 8) {
      throw new Error('Enter a valid email and a password with at least 8 characters.')
    }

    if (data.role !== 'owner' && data.role !== 'admin') {
      throw new Error('Only owner or admin roles can be created.')
    }

    const userClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
    })

    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) {
      throw new Error('Unauthorized')
    }

    const adminClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: adminRow, error: adminError } = await adminClient
      .from('dq_admin_users')
      .select('role, is_active')
      .eq('auth_user_id', userData.user.id)
      .maybeSingle()

    if (adminError || !adminRow?.is_active) {
      throw new Error('Unauthorized')
    }

    if (adminRow.role !== 'owner' && adminRow.role !== 'admin') {
      throw new Error('Only owners and admins can create admin accounts.')
    }

    if (data.role === 'owner' && adminRow.role !== 'owner') {
      throw new Error('Only owners can create owner accounts.')
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
    })

    if (createError || !created.user) {
      throw new Error(createError?.message ?? 'Could not create auth user.')
    }

    const { error: insertError } = await adminClient.from('dq_admin_users').insert({
      auth_user_id: created.user.id,
      email,
      role: data.role,
      is_active: true,
    })

    if (insertError) {
      await adminClient.auth.admin.deleteUser(created.user.id)
      throw new Error(insertError.message)
    }

    return { success: true as const }
  })
