import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from '#/integrations/supabase/client'
import { linkDonationsToUser, registerDonorAccount } from '#/lib/donor/donorAccountApi'

type DonorProfile = {
  fullName: string | null
  phone: string | null
}

type DonorAuthContextValue = {
  configured: boolean
  loading: boolean
  session: Session | null
  user: User | null
  profile: DonorProfile | null
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  requestPasswordReset: (email: string) => Promise<{ error?: string }>
  updatePassword: (password: string) => Promise<{ error?: string }>
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const DonorAuthContext = createContext<DonorAuthContextValue | null>(null)

export function DonorAuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<DonorProfile | null>(null)
  const configured = isSupabaseConfigured()

  const refreshProfile = useCallback(async () => {
    const sb = getSupabase()
    if (!sb || !session?.user) {
      setProfile(null)
      return
    }

    const { data } = await sb
      .from('dq_donor_profiles')
      .select('full_name, phone')
      .eq('auth_user_id', session.user.id)
      .maybeSingle()

    setProfile({
      fullName: data?.full_name ?? null,
      phone: data?.phone ?? null,
    })
  }, [session])

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) {
      setLoading(false)
      return
    }

    void sb.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = sb.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    void refreshProfile()
  }, [refreshProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const sb = getSupabase()
    if (!sb) return { error: 'Sign in is temporarily unavailable.' }
    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    if (data.session?.access_token) {
      await linkDonationsToUser({ data: { accessToken: data.session.access_token } })
    }
    return {}
  }, [])

  const requestPasswordReset = useCallback(async (email: string) => {
    const sb = getSupabase()
    if (!sb) return { error: 'Password reset is temporarily unavailable.' }

    const redirectTo = `${window.location.origin}/account/reset-password`
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo })
    if (error) return { error: error.message }
    return {}
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const sb = getSupabase()
    if (!sb) return { error: 'Password reset is temporarily unavailable.' }
    if (password.length < 8) return { error: 'Password must be at least 8 characters.' }

    const { error } = await sb.auth.updateUser({ password })
    if (error) return { error: error.message }
    return {}
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const sb = getSupabase()
    if (!sb) return { error: 'Registration is temporarily unavailable.' }
    if (password.length < 8) return { error: 'Password must be at least 8 characters.' }

    try {
      await registerDonorAccount({ data: { email, password, fullName } })
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Could not create account.' }
    }

    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    if (data.session?.access_token) {
      await linkDonationsToUser({ data: { accessToken: data.session.access_token } })
    }

    return {}
  }, [])

  const signOut = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) return
    await sb.auth.signOut()
    setProfile(null)
  }, [])

  const value = useMemo<DonorAuthContextValue>(
    () => ({
      configured,
      loading,
      session,
      user: session?.user ?? null,
      profile,
      signIn,
      requestPasswordReset,
      updatePassword,
      signUp,
      signOut,
      refreshProfile,
    }),
    [configured, loading, session, profile, signIn, requestPasswordReset, updatePassword, signUp, signOut, refreshProfile],
  )

  return <DonorAuthContext.Provider value={value}>{children}</DonorAuthContext.Provider>
}

export function useDonorAuth() {
  const ctx = useContext(DonorAuthContext)
  if (!ctx) throw new Error('useDonorAuth must be used within DonorAuthProvider')
  return ctx
}
