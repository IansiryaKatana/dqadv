import { useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { AdminAuthProvider } from '#/contexts/AdminAuthContext'
import { DonorAuthProvider } from '#/contexts/DonorAuthContext'
import { CmsProvider } from '#/contexts/CmsContext'
import { FloatingActionBubbleHost } from '#/components/layout/FloatingActionBubbleHost'

export function AppProviders({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isAdmin = pathname.startsWith('/backend')

  return (
    <AdminAuthProvider>
      <DonorAuthProvider>
        <CmsProvider enabled={!isAdmin}>
          {children}
          {!isAdmin ? <FloatingActionBubbleHost /> : null}
        </CmsProvider>
      </DonorAuthProvider>
    </AdminAuthProvider>
  )
}
