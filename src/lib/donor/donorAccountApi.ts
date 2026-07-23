import { createServerFn } from '@tanstack/react-start'
import { getSupabaseAdmin, getSupabaseUserClient } from '#/lib/integrations/supabaseAdmin'

export const registerDonorAccount = createServerFn({ method: 'POST' })
  .validator((data: { email: string; password: string; fullName: string }) => data)
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('Server configuration is missing.')

    const email = data.email.trim().toLowerCase()
    if (!email || data.password.length < 8) {
      throw new Error('Enter a valid email and a password with at least 8 characters.')
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
    })

    if (createError || !created.user) {
      throw new Error(createError?.message ?? 'Could not create account.')
    }

    const { error: profileError } = await admin.from('dq_donor_profiles').upsert(
      {
        auth_user_id: created.user.id,
        full_name: data.fullName.trim(),
        phone: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'auth_user_id' },
    )

    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id)
      throw new Error(profileError.message)
    }

    await admin
      .from('dq_donations')
      .update({ donor_user_id: created.user.id })
      .eq('donor_email', email)
      .is('donor_user_id', null)

    return { ok: true as const }
  })

export const linkDonationsToUser = createServerFn({ method: 'POST' })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }) => {
    const userClient = getSupabaseUserClient(data.accessToken)
    if (!userClient) throw new Error('Server configuration is missing.')

    const { data: userData } = await userClient.auth.getUser()
    if (!userData.user?.email) throw new Error('Unauthorized')

    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('Server configuration is missing.')

    const email = userData.user.email.toLowerCase()
    await admin
      .from('dq_donations')
      .update({ donor_user_id: userData.user.id })
      .eq('donor_email', email)
      .is('donor_user_id', null)

    return { ok: true as const }
  })

export const upsertDonorProfile = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      accessToken: string
      fullName: string
      phone?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    const userClient = getSupabaseUserClient(data.accessToken)
    if (!userClient) throw new Error('Server configuration is missing.')

    const { data: userData } = await userClient.auth.getUser()
    if (!userData.user) throw new Error('Unauthorized')

    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('Server configuration is missing.')

    const { error } = await admin.from('dq_donor_profiles').upsert(
      {
        auth_user_id: userData.user.id,
        full_name: data.fullName.trim(),
        phone: data.phone?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'auth_user_id' },
    )

    if (error) throw new Error(error.message)

    const email = userData.user.email?.toLowerCase()
    if (email) {
      await admin
        .from('dq_donations')
        .update({ donor_user_id: userData.user.id })
        .eq('donor_email', email)
        .is('donor_user_id', null)
    }

    return { ok: true as const }
  })

export const resendDonationReceiptFn = createServerFn({ method: 'POST' })
  .validator((data: { accessToken: string; donationId: string }) => data)
  .handler(async ({ data }) => {
    const { verifyAdminAccess } = await import('#/lib/admin/verifyAdminAccess')
    await verifyAdminAccess(data.accessToken)
    const { resendDonationReceipt } = await import('#/lib/email/sendDonationEmails')
    await resendDonationReceipt(data.donationId)
    return { ok: true as const }
  })

export const updateDonationFulfillment = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      accessToken: string
      donationId: string
      fulfillmentStatus: string
      adminNotes?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    const { verifyAdminAccess } = await import('#/lib/admin/verifyAdminAccess')
    await verifyAdminAccess(data.accessToken)

    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('Server configuration is missing.')

    const { error } = await admin
      .from('dq_donations')
      .update({
        fulfillment_status: data.fulfillmentStatus,
        admin_notes: data.adminNotes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.donationId)

    if (error) throw new Error(error.message)
    return { ok: true as const }
  })
