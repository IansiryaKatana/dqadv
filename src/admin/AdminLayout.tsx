import { Link, Navigate, Outlet, useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAdminAuth } from '#/contexts/AdminAuthContext'
import { AdminShell } from './AdminShell'

export function AdminLayout() {
  const { configured, loading, session, adminProfile, canBootstrap, signOut } = useAdminAuth()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isPublicAdminRoute =
    pathname === '/backend/login' ||
    pathname === '/backend/signup' ||
    pathname === '/backend/forgot-password' ||
    pathname === '/backend/reset-password'
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (isPublicAdminRoute) {
    return <Outlet />
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dq-black text-white">
        Loading…
      </div>
    )
  }

  if (!configured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dq-black p-6 text-center text-white">
        <div>
          <h1 className="text-2xl font-bold">Supabase not configured</h1>
          <p className="mt-2 text-white/70">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-dq-black text-white">Loading session…</div>
  }

  if (!session) {
    return <Navigate to="/backend/login" search={{ redirect: pathname }} replace />
  }

  if (!adminProfile?.is_active) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dq-black p-6 text-center text-white">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-bold">Admin access required</h1>
          <p className="text-white/70">
            {canBootstrap
              ? 'You are signed in, but this account is not linked as an admin yet. Finish setup to activate owner access.'
              : 'This account is signed in but is not registered as an active admin. Ask an owner or admin to create your account.'}
          </p>
          {session?.user ? (
            <p className="text-xs text-white/40">
              Signed in as {session.user.email}
              {session.user.id ? ` · ${session.user.id}` : ''}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" className="admin-btn-secondary" onClick={() => void signOut()}>
              Sign out
            </button>
            {canBootstrap ? (
              <Link to="/backend/signup" className="admin-btn-primary inline-flex items-center">
                Finish admin setup
              </Link>
            ) : (
              <Link to="/backend/signup" className="admin-btn-primary inline-flex items-center">
                Create admin
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return <AdminShell />
}
