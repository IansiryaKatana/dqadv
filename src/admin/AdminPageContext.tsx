import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'

export type AdminPageAction = {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export type AdminPageMeta = {
  title: string
  description?: string
  actions?: AdminPageAction[]
}

type AdminPageState = {
  title: string
  description?: string
  actions: AdminPageAction[]
}

type AdminPageContextValue = {
  page: AdminPageState | null
  setPage: (page: AdminPageState | null) => void
}

const AdminPageContext = createContext<AdminPageContextValue | null>(null)

const EMPTY_ACTIONS: AdminPageAction[] = []

export function AdminPageProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<AdminPageState | null>(null)

  const value = useMemo(() => ({ page, setPage }), [page])

  return <AdminPageContext.Provider value={value}>{children}</AdminPageContext.Provider>
}

export function useAdminPage() {
  const ctx = useContext(AdminPageContext)
  if (!ctx) throw new Error('useAdminPage must be used within AdminPageProvider')
  return ctx
}

export function useAdminPageHeader({ title, description, actions }: AdminPageMeta) {
  const { setPage } = useAdminPage()
  const resolvedActions = Array.isArray(actions) ? actions : EMPTY_ACTIONS
  const actionsKey = resolvedActions.map((action) => action.label).join('|')

  useLayoutEffect(() => {
    setPage({
      title,
      description,
      actions: resolvedActions,
    })
    return () => setPage(null)
    // actionsKey avoids re-running when `actions` is a new [] reference with the same labels
  }, [title, description, actionsKey, setPage])
}
