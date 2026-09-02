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

const FULFILLMENT_STATUSES = new Set(['pending', 'processing', 'shipped', 'delivered', 'not_required'])

export const listDonationsAdmin = createServerFn({ method: 'POST' })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }) => {
    const { verifyDonationsAccess } = await import('#/lib/admin/verifyAdminAccess')
    await verifyDonationsAccess(data.accessToken)

    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('Server configuration is missing.')

    const { data: rows, error } = await admin
      .from('dq_donations')
      .select(
        'id, reference, donor_name, donor_email, donor_phone, shipping_address, total, currency, payment_status, payment_provider, fulfillment_status, admin_notes, dedication, cart_snapshot, created_at, order_kind, frequency, items_subtotal, postage_total, subscription_id',
      )
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return rows ?? []
  })

export const resendDonationReceiptFn = createServerFn({ method: 'POST' })
  .validator((data: { accessToken: string; donationId: string }) => data)
  .handler(async ({ data }) => {
    const { verifyDonationsAccess } = await import('#/lib/admin/verifyAdminAccess')
    await verifyDonationsAccess(data.accessToken)
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
    const { verifyDonationsAccess } = await import('#/lib/admin/verifyAdminAccess')
    await verifyDonationsAccess(data.accessToken)

    if (!FULFILLMENT_STATUSES.has(data.fulfillmentStatus)) {
      throw new Error('Invalid fulfillment status.')
    }

    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('Server configuration is missing.')

    const { data: before } = await admin
      .from('dq_donations')
      .select('fulfillment_status, email_shipped_sent_at, order_kind')
      .eq('id', data.donationId)
      .maybeSingle()

    const { error } = await admin
      .from('dq_donations')
      .update({
        fulfillment_status: data.fulfillmentStatus,
        admin_notes: data.adminNotes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.donationId)

    if (error) throw new Error(error.message)

    if (
      data.fulfillmentStatus === 'shipped' &&
      before?.order_kind === 'quran_order' &&
      !before.email_shipped_sent_at
    ) {
      const { data: row } = await admin.from('dq_donations').select('*').eq('id', data.donationId).maybeSingle()
      if (row) {
        try {
          const { sendOrderShippedEmail } = await import('#/lib/email/sendDonationEmails')
          await sendOrderShippedEmail(row)
        } catch {
          // email failure should not block fulfillment
        }
      }
    }

    return { ok: true as const }
  })

export const bulkUpdateDonationFulfillment = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      accessToken: string
      donationIds: string[]
      fulfillmentStatus: string
    }) => data,
  )
  .handler(async ({ data }) => {
    const { verifyDonationsAccess } = await import('#/lib/admin/verifyAdminAccess')
    await verifyDonationsAccess(data.accessToken)

    const ids = [...new Set(data.donationIds.filter(Boolean))]
    if (!ids.length) throw new Error('Select at least one donation.')
    if (!FULFILLMENT_STATUSES.has(data.fulfillmentStatus)) {
      throw new Error('Invalid fulfillment status.')
    }

    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('Server configuration is missing.')

    const { data: beforeRows } =
      data.fulfillmentStatus === 'shipped'
        ? await admin
            .from('dq_donations')
            .select('id, order_kind, email_shipped_sent_at')
            .in('id', ids)
        : { data: [] as { id: string; order_kind: string | null; email_shipped_sent_at: string | null }[] }

    const { error } = await admin
      .from('dq_donations')
      .update({
        fulfillment_status: data.fulfillmentStatus,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)

    if (error) throw new Error(error.message)

    if (data.fulfillmentStatus === 'shipped') {
      const { sendOrderShippedEmail } = await import('#/lib/email/sendDonationEmails')
      const toEmail = (beforeRows ?? []).filter(
        (row) => row.order_kind === 'quran_order' && !row.email_shipped_sent_at,
      )
      for (const item of toEmail) {
        const { data: row } = await admin.from('dq_donations').select('*').eq('id', item.id).maybeSingle()
        if (!row) continue
        try {
          await sendOrderShippedEmail(row)
        } catch {
          // email failure should not block fulfillment
        }
      }
    }

    return { ok: true as const, count: ids.length }
  })

export const bulkDeleteDonations = createServerFn({ method: 'POST' })
  .validator((data: { accessToken: string; donationIds: string[] }) => data)
  .handler(async ({ data }) => {
    const { verifyDonationsAccess } = await import('#/lib/admin/verifyAdminAccess')
    await verifyDonationsAccess(data.accessToken)

    const ids = [...new Set(data.donationIds.filter(Boolean))]
    if (!ids.length) throw new Error('Select at least one donation.')

    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('Server configuration is missing.')

    const { error } = await admin.from('dq_donations').delete().in('id', ids)
    if (error) throw new Error(error.message)
    return { ok: true as const, count: ids.length }
  })

export const listDonorSubscriptions = createServerFn({ method: 'POST' })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }) => {
    const { getSupabaseUserClient } = await import('#/lib/integrations/supabaseAdmin')
    const userClient = getSupabaseUserClient(data.accessToken)
    if (!userClient) return []
    const { data: userData } = await userClient.auth.getUser()
    if (!userData.user) return []

    const admin = getSupabaseAdmin()
    if (!admin) return []

    const email = userData.user.email?.toLowerCase() ?? ''
    const { data: rows } = await admin
      .from('dq_donation_subscriptions')
      .select('id, provider, status, amount, currency, created_at, cancelled_at')
      .or(`donor_user_id.eq.${userData.user.id},donor_email.eq.${email}`)
      .order('created_at', { ascending: false })

    return rows ?? []
  })

export const cancelDonorSubscription = createServerFn({ method: 'POST' })
  .validator((data: { accessToken: string; subscriptionId: string }) => data)
  .handler(async ({ data }) => {
    const { getSupabaseUserClient } = await import('#/lib/integrations/supabaseAdmin')
    const userClient = getSupabaseUserClient(data.accessToken)
    if (!userClient) throw new Error('Unauthorized')
    const { data: userData } = await userClient.auth.getUser()
    if (!userData.user) throw new Error('Unauthorized')

    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('Server configuration is missing.')

    const email = userData.user.email?.toLowerCase() ?? ''
    const { data: sub } = await admin
      .from('dq_donation_subscriptions')
      .select('id, donor_user_id, donor_email')
      .eq('id', data.subscriptionId)
      .maybeSingle()

    if (!sub) throw new Error('Subscription not found.')
    const owns =
      sub.donor_user_id === userData.user.id || String(sub.donor_email).toLowerCase() === email
    if (!owns) throw new Error('You cannot cancel this subscription.')

    const { cancelSubscriptionById } = await import('#/lib/commerce/subscriptions')
    return cancelSubscriptionById({ subscriptionDbId: sub.id, actor: 'donor' })
  })

export const cancelSubscriptionAdmin = createServerFn({ method: 'POST' })
  .validator((data: { accessToken: string; subscriptionId: string }) => data)
  .handler(async ({ data }) => {
    const { verifyDonationsAccess } = await import('#/lib/admin/verifyAdminAccess')
    await verifyDonationsAccess(data.accessToken)
    const { cancelSubscriptionById } = await import('#/lib/commerce/subscriptions')
    return cancelSubscriptionById({ subscriptionDbId: data.subscriptionId, actor: 'admin' })
  })

