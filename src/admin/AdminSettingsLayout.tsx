import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useAdminAuth } from '#/contexts/AdminAuthContext'
import { canManageAdmins } from '#/lib/admin/adminUserApi'
import { cn } from '#/lib/utils'
import { AdminSite } from './AdminSite'
import { SETTINGS_SITE_TABS, isSettingsSiteTab } from './settingsTabs'

export function AdminSettingsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { adminProfile } = useAdminAuth()
  const showUsers = canManageAdmins(adminProfile)
  const isUsers = pathname.startsWith('/backend/settings/users')
  const segment = pathname.split('/').filter(Boolean).at(-1) ?? 'branding'
  const activeTab = isSettingsSiteTab(segment) ? segment : 'branding'

  return (
    <div className="admin-panel overflow-hidden">
      <div className="border-b border-[#e5e5e5] px-4 pt-3">
        <div className="admin-tabs mb-0 border-b-0" role="tablist" aria-label="Settings sections">
          {SETTINGS_SITE_TABS.map((tab) => (
            <Link
              key={tab.id}
              to={tab.to}
              role="tab"
              aria-selected={!isUsers && activeTab === tab.id}
              className={cn('admin-tab', !isUsers && activeTab === tab.id && 'admin-tab-active')}
            >
              {tab.label}
            </Link>
          ))}
          {showUsers ? (
            <Link
              to="/backend/settings/users"
              role="tab"
              aria-selected={isUsers}
              className={cn('admin-tab', isUsers && 'admin-tab-active')}
            >
              Users
            </Link>
          ) : null}
        </div>
      </div>

      {isUsers ? (
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      ) : (
        <>
          <AdminSite tab={activeTab} />
          <Outlet />
        </>
      )}
    </div>
  )
}
