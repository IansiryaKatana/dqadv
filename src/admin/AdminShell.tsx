import { Link, Navigate, Outlet, useRouterState } from '@tanstack/react-router'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAdminAuth } from '#/contexts/AdminAuthContext'
import { canManageAdmins, isOfficeAdmin, isOfficeAdminAllowedPath } from '#/lib/admin/adminUserApi'
import type { AdminInbox } from '#/lib/admin/adminInboxApi'
import { useAdminInbox } from '#/admin/AdminInboxContext'
import { AdminPageProvider, useAdminPage } from './AdminPageContext'
import { AdminNavBadge } from './components/AdminNavBadge'
import { adminNavLink, adminNavLinkActive } from './adminClassNames'
import { cn } from '#/lib/utils'
import '#/admin/admin-theme.css'

type AdminNavItem = {
  to: string
  label: string
  exact?: boolean
  inbox?: AdminInbox
}

const cmsNavItems: AdminNavItem[] = [
  { to: '/backend', label: 'Dashboard', exact: true },
  { to: '/backend/hero', label: 'Hero' },
  { to: '/backend/products', label: 'Products' },
  { to: '/backend/stories', label: 'Stories' },
  { to: '/backend/articles', label: 'Articles' },
  { to: '/backend/books', label: 'Books' },
  { to: '/backend/quran-editions', label: "Qur'an Editions" },
  { to: '/backend/videos', label: 'Videos' },
  { to: '/backend/quran-wiki', label: "Qur'an Wiki" },
  { to: '/backend/trust-content', label: 'Trust Content' },
  { to: '/backend/venture', label: 'Venture Gallery' },
  { to: '/backend/donations', label: 'Donations', inbox: 'donations' },
  { to: '/backend/submissions', label: 'Submissions', inbox: 'submissions' },
  { to: '/backend/settings', label: 'Settings' },
]

const officeAdminNavItems: AdminNavItem[] = [
  { to: '/backend/donations', label: 'Donations', inbox: 'donations' },
  { to: '/backend/submissions', label: 'Submissions', inbox: 'submissions' },
]

function AdminHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { page } = useAdminPage()

  return (
    <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#e5e5e5] bg-white px-4 py-4 md:items-center md:px-8">
      <div className="flex min-w-0 flex-1 items-start gap-3 md:items-center">
        <button
          type="button"
          className="mt-0.5 shrink-0 rounded-lg border border-[#e5e5e5] p-2 text-dq-black md:hidden"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-dq-black md:text-xl">{page?.title ?? 'Admin'}</h1>
          {page?.description ? <p className="admin-muted mt-0.5 line-clamp-2 text-sm">{page.description}</p> : null}
        </div>
      </div>
      {page?.actions.length ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {page.actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={action.variant === 'secondary' ? 'admin-btn-secondary' : 'admin-btn-primary'}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </header>
  )
}

function AdminShellInner() {
  const [open, setOpen] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { signOut, adminProfile } = useAdminAuth()
  const { counts } = useAdminInbox()
  const showUsers = canManageAdmins(adminProfile)
  const officeOnly = isOfficeAdmin(adminProfile)
  const navItems = officeOnly ? officeAdminNavItems : cmsNavItems
  const officeNeedsRedirect = officeOnly && !isOfficeAdminAllowedPath(pathname)

  return (
    <div className="admin-shell flex h-screen overflow-hidden">
      {officeNeedsRedirect ? <Navigate to="/backend/submissions" replace /> : null}
      <aside
        className={cn(
          'admin-sidebar fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-white/10 p-4 transition-transform md:static',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div className="mb-8 flex shrink-0 items-center justify-between gap-2">
          <Link to="/" className="flex min-w-0 items-center gap-2.5 text-xl font-extrabold">
            <img src="/favicon.png" alt="" className="h-7 w-7 shrink-0 rounded-sm object-contain" width={28} height={28} />
            <span className="truncate text-white">Donate Quran</span>
          </Link>
          <button type="button" className="md:hidden" onClick={() => setOpen(false)} aria-label="Close sidebar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-hidden">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to)
            const badgeCount = item.inbox ? counts[item.inbox] : 0
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(adminNavLink, 'flex items-center gap-2', active && adminNavLinkActive)}
                onClick={() => setOpen(false)}
              >
                <span className="truncate">{item.label}</span>
                <AdminNavBadge count={badgeCount} />
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto shrink-0 space-y-4 pt-4">
          {showUsers ? (
            <Link
              to="/backend/users"
              className={cn(adminNavLink, 'block', pathname.startsWith('/backend/users') && adminNavLinkActive)}
              onClick={() => setOpen(false)}
            >
              Users
            </Link>
          ) : null}
          <button
            type="button"
            className="admin-btn-primary flex w-full items-center justify-between gap-2"
            onClick={() => void signOut()}
          >
            <span>Sign out</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </button>
        </div>
      </aside>

      <div className="admin-content flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AdminHeader onOpenSidebar={() => setOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function AdminShell() {
  return (
    <AdminPageProvider>
      <AdminShellInner />
    </AdminPageProvider>
  )
}
