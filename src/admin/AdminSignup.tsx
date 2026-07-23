import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAdminAuth } from '#/contexts/AdminAuthContext'
import { createAdminUser } from '#/lib/admin/createAdminUser'
import type { SignupAdminRole } from '#/lib/admin/adminUserApi'
import { AdminSelect } from './components/AdminSelect'
import '#/admin/admin-theme.css'

export function AdminSignup() {
  const {
    configured,
    loading,
    session,
    adminProfile,
    canBootstrap,
    signUp,
    completeAdminRegistration,
    refreshAdminProfile,
  } = useAdminAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<SignupAdminRole>('owner')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const canCreateForOthers =
    Boolean(session && adminProfile?.is_active && (adminProfile.role === 'owner' || adminProfile.role === 'admin'))
  const completeSetupMode = Boolean(session && !adminProfile && canBootstrap)
  const bootstrapNewAccountMode = canBootstrap && !canCreateForOthers && !completeSetupMode
  const allowed = bootstrapNewAccountMode || canCreateForOthers || completeSetupMode

  useEffect(() => {
    void refreshAdminProfile()
  }, [refreshAdminProfile, session])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setBusy(true)

    try {
      if (completeSetupMode) {
        const result = await completeAdminRegistration(role)
        if (result.error) {
          setError(result.error)
          return
        }
        void navigate({ to: '/backend' })
        return
      }

      if (bootstrapNewAccountMode) {
        if (password !== confirmPassword) {
          setError('Passwords do not match.')
          return
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters.')
          return
        }

        const result = await signUp(email.trim(), password, role)
        if (result.error) {
          setError(result.error)
          return
        }
        if (result.needsEmailConfirmation) {
          setMessage('Check your email to confirm your account, then sign in and return here to finish admin setup.')
          return
        }
        void navigate({ to: '/backend' })
        return
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.')
        return
      }

      if (!session?.access_token) {
        setError('Your session expired. Sign in again and retry.')
        return
      }

      await createAdminUser({
        data: {
          email: email.trim(),
          password,
          role,
          accessToken: session.access_token,
        },
      })

      setMessage(`Created ${role} account for ${email.trim()}. They can sign in now.`)
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setRole('admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create admin account.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-auth-page flex min-h-screen items-center justify-center p-4">
      <div className="admin-panel w-full max-w-md p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-dq-black">{completeSetupMode ? 'Complete admin setup' : 'Create admin'}</h1>
          <Link to="/backend/login" className="text-sm text-dq-gold hover:underline">
            Sign in
          </Link>
        </div>

        {!configured ? (
          <p className="text-sm admin-muted">Configure Supabase environment variables to enable admin signup.</p>
        ) : loading ? (
          <p className="text-sm admin-muted">Loading…</p>
        ) : !allowed ? (
          <div className="space-y-4 text-sm admin-muted">
            <p>Admin signup is closed. An owner or admin must create your account.</p>
            <Link to="/backend/login" className="admin-btn-primary inline-flex">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm admin-muted">
              {completeSetupMode
                ? 'You are signed in, but this account is not linked as an admin yet. Choose owner or admin to finish setup.'
                : bootstrapNewAccountMode
                  ? 'No admin accounts exist yet. Create the first owner or admin account.'
                  : 'Create another owner or admin account for your team.'}
            </p>
            <form className="space-y-4" onSubmit={onSubmit}>
              {!completeSetupMode ? (
                <>
                  <label className="block space-y-2">
                    <span className="admin-label">Email</span>
                    <input
                      className="admin-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="admin-label">Password</span>
                    <input
                      className="admin-input"
                      type="password"
                      required={!completeSetupMode}
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="admin-label">Confirm password</span>
                    <input
                      className="admin-input"
                      type="password"
                      required={!completeSetupMode}
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </label>
                </>
              ) : (
                <p className="rounded-lg border border-[#e5e5e5] bg-[#f7f7f5] px-3 py-2 text-sm text-dq-black">
                  Signed in as <span className="font-medium">{session?.user.email}</span>
                </p>
              )}
              <label className="block space-y-2">
                <span className="admin-label">Role</span>
                <AdminSelect
                  value={role}
                  onValueChange={(value) => setRole(value as SignupAdminRole)}
                  options={[
                    ...(bootstrapNewAccountMode || completeSetupMode || adminProfile?.role === 'owner'
                      ? [{ value: 'owner', label: 'Owner' }]
                      : []),
                    { value: 'admin', label: 'Admin' },
                  ]}
                />
              </label>
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
              <button type="submit" className="admin-btn-primary w-full" disabled={busy}>
                {busy
                  ? 'Saving…'
                  : completeSetupMode
                    ? 'Finish admin setup'
                    : bootstrapNewAccountMode
                      ? 'Create account'
                      : 'Create admin account'}
              </button>
            </form>
            {canCreateForOthers ? (
              <Link to="/backend" className="mt-4 inline-block text-sm text-dq-gold hover:underline">
                Back to dashboard
              </Link>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
