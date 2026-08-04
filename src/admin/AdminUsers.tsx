import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Navigate } from '@tanstack/react-router'
import { useAdminAuth } from '#/contexts/AdminAuthContext'
import { createAdminUser } from '#/lib/admin/createAdminUser'
import { listAdminUsers, updateAdminUser } from '#/lib/admin/manageAdminUsers'
import { canManageAdmins, type AdminRole } from '#/lib/admin/adminUserApi'
import { useAdminPageHeader } from './AdminPageContext'
import { AdminModal } from './components/AdminModal'
import { AdminSelect } from './components/AdminSelect'
import { PasswordInput } from '#/components/ui/PasswordInput'
import { adminTable, adminTableWrap, adminTd, adminTh } from './adminClassNames'

type AdminUserRow = {
  id: string
  email: string
  role: AdminRole
  is_active: boolean
  created_at: string | null
  auth_user_id: string | null
}

const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'office_admin', label: 'Office admin' },
  { value: 'viewer', label: 'Viewer' },
]

function emptyCreateForm() {
  return {
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin' as AdminRole,
  }
}

export function AdminUsers() {
  const { session, adminProfile } = useAdminAuth()
  const allowed = canManageAdmins(adminProfile)
  const [rows, setRows] = useState<AdminUserRow[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createErr, setCreateErr] = useState<string | null>(null)
  const [form, setForm] = useState(emptyCreateForm)

  const headerActions = useMemo(
    () => [
      {
        label: 'Create user',
        onClick: () => {
          setCreateErr(null)
          setForm(emptyCreateForm())
          setCreateOpen(true)
        },
      },
    ],
    [],
  )

  useAdminPageHeader({
    title: 'Users',
    description: 'Create and manage CMS admin accounts.',
    actions: headerActions,
  })

  const load = useCallback(async () => {
    if (!session?.access_token) return
    try {
      const data = await listAdminUsers({ data: { accessToken: session.access_token } })
      setRows(data)
      setErr(null)
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Could not load admin users.')
    }
  }, [session?.access_token])

  useEffect(() => {
    if (allowed) void load()
  }, [allowed, load])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setCreateErr(null)
    setMsg(null)

    if (form.password !== form.confirmPassword) {
      setCreateErr('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setCreateErr('Password must be at least 8 characters.')
      return
    }
    if (!session?.access_token) {
      setCreateErr('Your session expired. Sign in again.')
      return
    }
    if (form.role === 'owner' && adminProfile?.role !== 'owner') {
      setCreateErr('Only owners can create owner accounts.')
      return
    }

    setBusy(true)
    try {
      await createAdminUser({
        data: {
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          accessToken: session.access_token,
        },
      })
      setMsg(`Created ${form.role} account for ${form.email.trim()}.`)
      setForm(emptyCreateForm())
      setCreateOpen(false)
      await load()
    } catch (error) {
      setCreateErr(error instanceof Error ? error.message : 'Could not create user.')
    } finally {
      setBusy(false)
    }
  }

  async function updateUser(id: string, patch: Partial<Pick<AdminUserRow, 'role' | 'is_active'>>) {
    setErr(null)
    setMsg(null)
    if (!session?.access_token) {
      setErr('Your session expired. Sign in again.')
      return
    }

    const target = rows.find((row) => row.id === id)
    if (!target) return

    if (target.auth_user_id && target.auth_user_id === session.user.id && patch.is_active === false) {
      setErr('You cannot deactivate your own account.')
      return
    }
    if (patch.role === 'owner' && adminProfile?.role !== 'owner') {
      setErr('Only owners can assign the owner role.')
      return
    }

    try {
      await updateAdminUser({
        data: {
          accessToken: session.access_token,
          id,
          role: patch.role,
          isActive: patch.is_active,
        },
      })
      setMsg('User updated.')
      await load()
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Could not update user.')
    }
  }

  if (!allowed) {
    return <Navigate to="/backend" replace />
  }

  const createRoleOptions =
    adminProfile?.role === 'owner'
      ? ROLE_OPTIONS
      : ROLE_OPTIONS.filter((option) => option.value !== 'owner')

  return (
    <div className="space-y-6">
      {err ? <p className="text-sm text-red-500">{err}</p> : null}
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}

      <section>
        <div className={adminTableWrap}>
          <table className={adminTable}>
            <thead>
              <tr>
                <th className={adminTh}>Email</th>
                <th className={adminTh}>Role</th>
                <th className={adminTh}>Status</th>
                <th className={adminTh}>Created</th>
                <th className={adminTh}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className={adminTd} colSpan={5}>
                    No admin users yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isSelf = Boolean(row.auth_user_id && row.auth_user_id === session?.user.id)
                  return (
                    <tr key={row.id}>
                      <td className={adminTd}>
                        {row.email}
                        {isSelf ? <span className="admin-muted ml-2 text-xs">(you)</span> : null}
                      </td>
                      <td className={adminTd}>
                        <AdminSelect
                          value={row.role}
                          onValueChange={(value) => void updateUser(row.id, { role: value as AdminRole })}
                          options={
                            adminProfile?.role === 'owner'
                              ? ROLE_OPTIONS
                              : ROLE_OPTIONS.filter((option) => option.value !== 'owner' || row.role === 'owner')
                          }
                          disabled={isSelf && row.role === 'owner'}
                        />
                      </td>
                      <td className={adminTd}>{row.is_active ? 'Active' : 'Inactive'}</td>
                      <td className={adminTd}>
                        {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className={adminTd}>
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          disabled={isSelf}
                          onClick={() => void updateUser(row.id, { is_active: !row.is_active })}
                        >
                          {row.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AdminModal
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) {
            setCreateErr(null)
            setForm(emptyCreateForm())
          }
        }}
        title="Create user"
        footer={
          <>
            <button type="button" className="admin-btn-secondary" onClick={() => setCreateOpen(false)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" form="admin-create-user-form" className="admin-btn-primary" disabled={busy}>
              {busy ? 'Creating…' : 'Create user'}
            </button>
          </>
        }
      >
        <p className="admin-muted mb-4 text-sm">Create an admin account.</p>
        <form id="admin-create-user-form" className="grid gap-3 md:grid-cols-2" onSubmit={onCreate}>
          <label className="block space-y-1.5 md:col-span-2">
            <span className="admin-label">Email</span>
            <input
              className="admin-input"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="admin-label">Password</span>
            <PasswordInput
              className="admin-input"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="admin-label">Confirm password</span>
            <PasswordInput
              className="admin-input"
              required
              minLength={8}
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            />
          </label>
          <label className="block space-y-1.5 md:col-span-2">
            <span className="admin-label">Role</span>
            <AdminSelect
              value={form.role}
              onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as AdminRole }))}
              options={createRoleOptions}
            />
          </label>
          {createErr ? <p className="text-sm text-red-500 md:col-span-2">{createErr}</p> : null}
        </form>
      </AdminModal>
    </div>
  )
}
