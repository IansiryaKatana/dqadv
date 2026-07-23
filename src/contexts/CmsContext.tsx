import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'
import type { CmsSnapshot } from '#/lib/cms/types'

type CmsContextValue = {
  data: CmsSnapshot | null
  loading: boolean
  mode: 'live' | 'static' | 'loading'
  refetch: () => Promise<void>
}

const CmsContext = createContext<CmsContextValue | null>(null)

export function CmsProvider({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const [data, setData] = useState<CmsSnapshot | null>(null)
  const [loading, setLoading] = useState(enabled)

  const refetch = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    const snapshot = await loadCmsSnapshot()
    setData(snapshot)
    setLoading(false)
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    void refetch()
  }, [enabled, refetch])

  const value = useMemo<CmsContextValue>(
    () => ({
      data,
      loading,
      mode: loading ? 'loading' : (data?.mode ?? 'static'),
      refetch,
    }),
    [data, loading, refetch],
  )

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>
}

export function useCms() {
  const ctx = useContext(CmsContext)
  if (!ctx) throw new Error('useCms must be used within CmsProvider')
  return ctx
}
