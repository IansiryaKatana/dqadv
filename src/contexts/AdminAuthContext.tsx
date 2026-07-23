import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from '#/integrations/supabase/client'
import {
  canBootstrapAdmin,
  fetchAdminProfile,
  registerAdminUser,
  type AdminProfile,
  type SignupAdminRole,
} from '#/lib/admin/adminUserApi'

type AdminAuthContextValue = {
  configured: boolean
  loading: boolean
  session: Session | null
  user: User | null
  adminProfile: AdminProfile | null
  canBootstrap: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  requestPasswordReset: (email: string) => Promise<{ error?: string }>
  updatePassword: (password: string) => Promise<{ error?: string }>
  signUp: (
    email: string,
    password: string,
    role: SignupAdminRole,
  ) => Promise<{ error?: string; needsEmailConfirmation?: boolean }>
  completeAdminRegistration: (role: SignupAdminRole) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshAdminProfile: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null)
  const [canBootstrap, setCanBootstrap] = useState(false)
  const configured = isSupabaseConfigured()
  const loading = authLoading || profileLoading

  const refreshAdminProfile = useCallback(async () => {
    const sb = getSupabase()
    if (!sb || !session?.user) {
      setAdminProfile(null)
      setCanBootstrap(false)
      setProfileLoading(false)
      return
    }

    setProfileLoading(true)

    try {
      const [bootstrap, profile] = await Promise.all([canBootstrapAdmin(), fetchAdminProfile()])
      setCanBootstrap(bootstrap)
      setAdminProfile(profile)
    } finally {
      setProfileLoading(false)
    }
  }, [session])

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) {
      setAuthLoading(false)
      return
    }

    void sb.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })

    const { data: sub } = sb.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthLoading(false)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    void refreshAdminProfile()
  }, [refreshAdminProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const sb = getSupabase()
    if (!sb) return { error: 'Supabase is not configured.' }
    const { error } = await sb.auth.signInWithPassword({ email, password })
    return error ? { error: error.message } : {}
  }, [])

  const requestPasswordReset = useCallback(async (email: string) => {
    const sb = getSupabase()
    if (!sb) return { error: 'Password reset is temporarily unavailable.' }

    const redirectTo = `${window.location.origin}/backend/reset-password`
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo })
    return error ? { error: error.message } : {}
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const sb = getSupabase()
    if (!sb) return { error: 'Password reset is temporarily unavailable.' }
    if (password.length < 8) return { error: 'Password must be at least 8 characters.' }

    const { error } = await sb.auth.updateUser({ password })
    return error ? { error: error.message } : {}
  }, [])

  const completeAdminRegistration = useCallback(async (role: SignupAdminRole) => {
    const sb = getSupabase()
    if (!sb) return { error: 'Supabase is not configured.' }
    if (!session) return { error: 'Sign in first to complete admin setup.' }

    const registerResult = await registerAdminUser(role)
    if (registerResult.error) return registerResult

    await refreshAdminProfile()
    return {}
  }, [session, refreshAdminProfile])

  const signUp = useCallback(async (email: string, password: string, role: SignupAdminRole) => {
    const sb = getSupabase()
    if (!sb) return { error: 'Supabase is not configured.' }

    const bootstrap = await canBootstrapAdmin()
    if (!bootstrap) {
      return { error: 'Admin signup is closed. Ask an existing owner or admin to create your account.' }
    }

    const { data, error } = await sb.auth.signUp({ email, password })
    if (error) return { error: error.message }

    if (!data.session) {
      return { needsEmailConfirmation: true }
    }

    const registerResult = await registerAdminUser(role)
    if (registerResult.error) {
      await sb.auth.signOut()
      return { error: registerResult.error }
    }

    await refreshAdminProfile()
    return {}
  }, [refreshAdminProfile])

  const signOut = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) return
    await sb.auth.signOut()
    setAdminProfile(null)
    setCanBootstrap(false)
  }, [])

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      configured,
      loading,
      session,
      user: session?.user ?? null,
      adminProfile,
      canBootstrap,
      signIn,
      requestPasswordReset,
      updatePassword,
      signUp,
      completeAdminRegistration,
      signOut,
      refreshAdminProfile,
    }),
    [configured, loading, session, adminProfile, canBootstrap, signIn, requestPasswordReset, updatePassword, signUp, completeAdminRegistration, signOut, refreshAdminProfile],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
