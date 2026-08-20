import { Link, Navigate, Outlet, useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAdminAuth } from '#/contexts/AdminAuthContext'
import { AdminInboxProvider } from '#/admin/AdminInboxContext'
import { isSafeAdminReturnPath, stashAdminReturnPath } from '#/lib/admin/adminReturnPath'
import { AdminBrandingHead } from './AdminBrandingHead'
import { AdminShell } from './AdminShell'

export function AdminLayout() {
  return (
    <AdminInboxProvider>
      <AdminLayoutInner />
    </AdminInboxProvider>
  )
}

function RedirectToAdminLogin({ pathname }: { pathname: string }) {
  stashAdminReturnPath(pathname)

  return (
    <Navigate
      to="/backend/login"
      search={{ redirect: isSafeAdminReturnPath(pathname) ? pathname : undefined }}
      replace
    />
  )
}

function AdminLayoutInner() {
  const { configured, loading, session, adminProfile, canBootstrap, signOut } = useAdminAuth()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isPublicAdminRoute =
    pathname === '/backend/login' ||
    pathname === '/backend/signup' ||
    pathname === '/backend/forgot-password' ||
    pathname === '/backend/reset-password'
  const [mounted, setMounted] = useState(false)
  const [shellReady, setShellReady] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (session && adminProfile?.is_active) {
      setShellReady(true)
      return
    }
    if (!loading && !session) setShellReady(false)
  }, [session, adminProfile?.is_active, loading])

  let body
  if (isPublicAdminRoute) {
    body = <Outlet />
  } else if (!mounted) {
    body = (
      <div className="flex min-h-screen items-center justify-center bg-dq-black text-white">
        Loading…
      </div>
    )
  } else if (!configured) {
    body = (
      <div className="flex min-h-screen items-center justify-center bg-dq-black p-6 text-center text-white">
        <div>
          <h1 className="text-2xl font-bold">Supabase not configured</h1>
          <p className="mt-2 text-white/70">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.</p>
        </div>
      </div>
    )
  } else if (shellReady && session && adminProfile?.is_active) {
    body = (
      <div className="relative h-dvh overflow-hidden">
        <AdminShell />
        {loading ? (
          <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-dq-black/50 text-white">
            Loading session…
          </div>
        ) : null}
      </div>
    )
  } else if (loading) {
    body = <div className="flex min-h-screen items-center justify-center bg-dq-black text-white">Loading session…</div>
  } else if (!session) {
    body = <RedirectToAdminLogin pathname={pathname} />
  } else if (!adminProfile?.is_active) {
    body = (
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
  } else {
    body = (
      <div className="h-dvh overflow-hidden">
        <AdminShell />
      </div>
    )
  }

  return (
    <>
      <AdminBrandingHead />
      {body}
    </>
  )
}
