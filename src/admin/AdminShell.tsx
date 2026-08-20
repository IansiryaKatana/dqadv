import { Link, Navigate, Outlet, useRouterState } from '@tanstack/react-router'
import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAdminAuth } from '#/contexts/AdminAuthContext'
import { isOfficeAdmin, isOfficeAdminAllowedPath } from '#/lib/admin/adminUserApi'
import type { AdminInbox } from '#/lib/admin/adminInboxApi'
import { useAdminInbox } from '#/admin/AdminInboxContext'
import { Logo } from '#/components/layout/Logo'
import { AdminPageProvider, useAdminPage } from './AdminPageContext'
import { AdminNavBadge } from './components/AdminNavBadge'
import { adminNavLink, adminNavLinkActive } from './adminClassNames'
import { useAdminBrandSettings } from './useAdminBrandSettings'
import { cn } from '#/lib/utils'
import '#/admin/admin-theme.css'

const SIDEBAR_OPEN_KEY = 'dq-admin-nav-open'

type AdminNavItem = {
  to: string
  label: string
  exact?: boolean
  activePrefix?: string
  inbox?: AdminInbox
}

type AdminNavSection = {
  label?: string
  inbox?: AdminInbox
  items: AdminNavItem[]
}

const submissionsItems: AdminNavItem[] = [
  { to: '/backend/submissions/contact', label: 'Contact' },
  { to: '/backend/submissions/free-quran', label: "Free Qur'an" },
  { to: '/backend/submissions/distributor', label: 'Distributor' },
]

const cmsNavSections: AdminNavSection[] = [
  { items: [{ to: '/backend', label: 'Dashboard', exact: true }] },
  {
    label: 'Content',
    items: [
      { to: '/backend/content/hero', label: 'Hero' },
      { to: '/backend/content/stories', label: 'Stories' },
      { to: '/backend/content/articles', label: 'Articles' },
      { to: '/backend/content/books', label: 'Books' },
      { to: '/backend/content/quran-editions', label: "Qur'an Editions" },
      { to: '/backend/content/videos', label: 'Videos' },
      { to: '/backend/content/quran-wiki', label: "Qur'an Wiki" },
      { to: '/backend/content/trust-content', label: 'Trust Content' },
      { to: '/backend/content/venture', label: 'Venture Gallery' },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { to: '/backend/commerce/products', label: 'Products' },
      { to: '/backend/commerce/donations', label: 'Donations', inbox: 'donations' },
    ],
  },
  {
    label: 'Submissions',
    inbox: 'submissions',
    items: submissionsItems,
  },
  {
    label: 'Settings',
    items: [{ to: '/backend/settings/branding', label: 'Settings', activePrefix: '/backend/settings' }],
  },
]

const officeAdminNavSections: AdminNavSection[] = [
  {
    label: 'Commerce',
    items: [{ to: '/backend/commerce/donations', label: 'Donations', inbox: 'donations' }],
  },
  {
    label: 'Submissions',
    inbox: 'submissions',
    items: submissionsItems,
  },
]

function itemIsActive(item: AdminNavItem, pathname: string) {
  return item.exact ? pathname === item.to : pathname.startsWith(item.activePrefix ?? item.to)
}

function sectionIsActive(section: AdminNavSection, pathname: string) {
  return section.items.some((item) => itemIsActive(item, pathname))
}

function readOpenSections(): Record<string, boolean> {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(SIDEBAR_OPEN_KEY)
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

function writeOpenSections(open: Record<string, boolean>) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(SIDEBAR_OPEN_KEY, JSON.stringify(open))
}

function initialOpenSections(sections: AdminNavSection[], pathname: string): Record<string, boolean> {
  const saved = readOpenSections()
  const next: Record<string, boolean> = {}
  for (const section of sections) {
    if (!section.label) continue
    next[section.label] = saved[section.label] ?? sectionIsActive(section, pathname)
    if (sectionIsActive(section, pathname)) next[section.label] = true
  }
  return next
}

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
  const officeOnly = isOfficeAdmin(adminProfile)
  const navSections = officeOnly ? officeAdminNavSections : cmsNavSections
  const officeNeedsRedirect = officeOnly && !isOfficeAdminAllowedPath(pathname)
  const brandSettings = useAdminBrandSettings()
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    initialOpenSections(navSections, pathname),
  )

  useEffect(() => {
    setOpenSections((prev) => {
      const next = { ...prev }
      let changed = false
      for (const section of navSections) {
        if (!section.label || !sectionIsActive(section, pathname) || next[section.label]) continue
        next[section.label] = true
        changed = true
      }
      if (changed) writeOpenSections(next)
      return changed ? next : prev
    })
  }, [pathname, navSections])

  function toggleSection(label: string) {
    setOpenSections((prev) => {
      const next = { ...prev, [label]: !prev[label] }
      writeOpenSections(next)
      return next
    })
  }

  return (
    <div className="admin-shell flex h-full min-h-0 overflow-hidden">
      {officeNeedsRedirect ? <Navigate to="/backend/submissions/contact" replace /> : null}
      <aside
        className={cn(
          'admin-sidebar fixed inset-y-0 left-0 z-40 flex h-full min-h-0 w-64 shrink-0 flex-col overflow-hidden border-r border-white/10 p-4 transition-transform md:static',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 pb-4">
          <Logo
            variant="dark"
            darkSrc={brandSettings.logo_dark_url}
            className="min-w-0 max-w-[11.5rem]"
          />
          <button type="button" className="md:hidden" onClick={() => setOpen(false)} aria-label="Close sidebar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="h-px shrink-0 bg-white/10" aria-hidden />
        <nav className="admin-sidebar-nav min-h-0 flex-1 space-y-1 pt-4">
          {navSections.map((section, index) => {
            const expanded = section.label ? Boolean(openSections[section.label]) : true
            const sectionBadge =
              (section.inbox ? counts[section.inbox] : 0) +
              section.items.reduce((sum, item) => sum + (item.inbox ? counts[item.inbox] : 0), 0)
            return (
              <div key={section.label ?? `section-${index}`}>
                {section.label ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-white/85 hover:bg-white/15 hover:text-white"
                    aria-expanded={expanded}
                    onClick={() => toggleSection(section.label)}
                  >
                    <span className="min-w-0 flex-1 truncate">{section.label}</span>
                    <AdminNavBadge count={sectionBadge} />
                    <ChevronDown
                      className={cn('h-4 w-4 shrink-0 transition-transform', expanded ? 'rotate-0' : '-rotate-90')}
                      aria-hidden
                    />
                  </button>
                ) : null}
                {expanded ? (
                  <div
                    className={cn(
                      'space-y-0.5',
                      section.label && 'ml-3 border-l border-white/15 pb-1 pl-2.5',
                    )}
                  >
                    {section.items.map((item) => {
                      const active = itemIsActive(item, pathname)
                      const badgeCount = item.inbox ? counts[item.inbox] : 0
                      const nested = Boolean(section.label)
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={cn(
                            adminNavLink,
                            'flex items-center gap-2',
                            nested && 'rounded-lg py-1.5 text-[13px] font-normal text-white/70',
                            active && adminNavLinkActive,
                          )}
                          onClick={() => setOpen(false)}
                        >
                          <span className="truncate">{item.label}</span>
                          <AdminNavBadge count={badgeCount} />
                        </Link>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </nav>
        <div className="mt-auto shrink-0 border-t border-white/10 pt-4">
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
