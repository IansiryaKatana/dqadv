import { getSupabase } from '#/integrations/supabase/client'

export type AdminInbox = 'donations' | 'submissions'

export type AdminInboxCounts = {
  donations: number
  submissions: number
}

const emptyCounts: AdminInboxCounts = { donations: 0, submissions: 0 }

export async function fetchInboxMissedCounts(): Promise<AdminInboxCounts> {
  const sb = getSupabase()
  if (!sb) return emptyCounts

  const { data, error } = await sb.rpc('dq_get_inbox_missed_counts')

  if (error) {
    console.error('fetchInboxMissedCounts', error)
    return emptyCounts
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) return emptyCounts

  return {
    donations: Number(row.donations ?? 0),
    submissions: Number(row.submissions ?? 0),
  }
}

export async function markInboxViewed(inbox: AdminInbox): Promise<void> {
  const sb = getSupabase()
  if (!sb) return

  const { error } = await sb.rpc('dq_mark_inbox_viewed', { p_inbox: inbox })

  if (error) {
    console.error('markInboxViewed', error)
  }
}
