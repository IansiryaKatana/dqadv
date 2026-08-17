import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAdminAuth } from '#/contexts/AdminAuthContext'
import { canAccessDonations, canAccessSubmissions } from '#/lib/admin/adminUserApi'
import {
  fetchInboxMissedCounts,
  markInboxViewed as markInboxViewedApi,
  type AdminInbox,
  type AdminInboxCounts,
} from '#/lib/admin/adminInboxApi'

type AdminInboxContextValue = {
  counts: AdminInboxCounts
  loading: boolean
  refresh: () => Promise<void>
  markViewed: (inbox: AdminInbox) => Promise<void>
}

const AdminInboxContext = createContext<AdminInboxContextValue | null>(null)

const POLL_MS = 60_000

export function AdminInboxProvider({ children }: { children: ReactNode }) {
  const { adminProfile, session } = useAdminAuth()
  const [counts, setCounts] = useState<AdminInboxCounts>({ donations: 0, submissions: 0 })
  const [loading, setLoading] = useState(true)

  const canSeeCounts =
    Boolean(session) &&
    adminProfile?.is_active &&
    (canAccessDonations(adminProfile) || canAccessSubmissions(adminProfile))

  const refresh = useCallback(async () => {
    if (!canSeeCounts) {
      setCounts({ donations: 0, submissions: 0 })
      setLoading(false)
      return
    }

    const next = await fetchInboxMissedCounts()
    setCounts(next)
    setLoading(false)
  }, [canSeeCounts])

  const markViewed = useCallback(
    async (inbox: AdminInbox) => {
      await markInboxViewedApi(inbox)
      setCounts((prev) => ({ ...prev, [inbox]: 0 }))
      void refresh()
    },
    [refresh],
  )

  useEffect(() => {
    setLoading(true)
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!canSeeCounts) return

    const interval = window.setInterval(() => {
      void refresh()
    }, POLL_MS)

    const onFocus = () => {
      void refresh()
    }

    window.addEventListener('focus', onFocus)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [canSeeCounts, refresh])

  const value = useMemo(
    () => ({
      counts,
      loading,
      refresh,
      markViewed,
    }),
    [counts, loading, refresh, markViewed],
  )

  return <AdminInboxContext.Provider value={value}>{children}</AdminInboxContext.Provider>
}

export function useAdminInbox() {
  const ctx = useContext(AdminInboxContext)
  if (!ctx) throw new Error('useAdminInbox must be used within AdminInboxProvider')
  return ctx
}

export function useMarkInboxViewed(inbox: AdminInbox) {
  const { markViewed } = useAdminInbox()

  useEffect(() => {
    void markViewed(inbox)
  }, [inbox, markViewed])
}
