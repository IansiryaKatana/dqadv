import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { getSupabase } from '#/integrations/supabase/client'
import { useAdminAuth } from '#/contexts/AdminAuthContext'
import { createAdminUser } from '#/lib/admin/createAdminUser'
import { canManageAdmins, type AdminRole } from '#/lib/admin/adminUserApi'
import { useAdminPageHeader } from './AdminPageContext'
import { AdminSelect } from './components/AdminSelect'
import { adminTable, adminTableWrap, adminTd, adminTh } from './adminClassNames'
import { Navigate } from '@tanstack/react-router'

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
  { value: 'viewer', label: 'Viewer' },
]

export function AdminUsers() {
  const { session, adminProfile } = useAdminAuth()
  const allowed = canManageAdmins(adminProfile)
  const [rows, setRows] = useState<AdminUserRow[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<AdminRole>('admin')

  useAdminPageHeader({
    title: 'Users',
    description: 'Create and manage CMS admin accounts.',
    actions: [],
  })

  const load = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) return
    const { data, error } = await sb
      .from('dq_admin_users')
      .select('id, email, role, is_active, created_at, auth_user_id')
      .order('created_at', { ascending: true })
    if (error) setErr(error.message)
    else setRows((data ?? []) as AdminUserRow[])
  }, [])

  useEffect(() => {
    if (allowed) void load()
  }, [allowed, load])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setErr(null)
    setMsg(null)

    if (password !== confirmPassword) {
      setErr('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setErr('Password must be at least 8 characters.')
      return
    }
    if (!session?.access_token) {
      setErr('Your session expired. Sign in again.')
      return
    }
    if (role === 'owner' && adminProfile?.role !== 'owner') {
      setErr('Only owners can create owner accounts.')
      return
    }

    setBusy(true)
    try {
      await createAdminUser({
        data: {
          email: email.trim(),
          password,
          role,
          accessToken: session.access_token,
        },
      })
      setMsg(`Created ${role} account for ${email.trim()}.`)
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setRole('admin')
      await load()
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Could not create user.')
    } finally {
      setBusy(false)
    }
  }

  async function updateUser(id: string, patch: Partial<Pick<AdminUserRow, 'role' | 'is_active'>>) {
    setErr(null)
    setMsg(null)
    const sb = getSupabase()
    if (!sb) return

    const target = rows.find((row) => row.id === id)
    if (!target) return

    if (target.auth_user_id && target.auth_user_id === session?.user.id && patch.is_active === false) {
      setErr('You cannot deactivate your own account.')
      return
    }
    if (patch.role === 'owner' && adminProfile?.role !== 'owner') {
      setErr('Only owners can assign the owner role.')
      return
    }

    const { error } = await sb
      .from('dq_admin_users')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) setErr(error.message)
    else {
      setMsg('User updated.')
      await load()
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
      <section className="admin-panel p-4">
        <h2 className="text-sm font-semibold text-dq-black">Create user</h2>
        <p className="admin-muted mt-1 text-sm">Creates a Supabase auth account and links it as a CMS admin.</p>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onCreate}>
          <label className="block space-y-1.5 md:col-span-2">
            <span className="admin-label">Email</span>
            <input
              className="admin-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="admin-label">Password</span>
            <input
              className="admin-input"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="admin-label">Confirm password</span>
            <input
              className="admin-input"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>
          <label className="block space-y-1.5 md:col-span-2">
            <span className="admin-label">Role</span>
            <AdminSelect
              value={role}
              onValueChange={(value) => setRole(value as AdminRole)}
              options={createRoleOptions}
            />
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="admin-btn-primary" disabled={busy}>
              {busy ? 'Creating…' : 'Create user'}
            </button>
          </div>
        </form>
      </section>

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
    </div>
  )
}
