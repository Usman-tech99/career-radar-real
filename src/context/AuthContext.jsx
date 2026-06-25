import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [onboardingComplete, setOnboardingComplete] = useState(false)

  async function fetchRoleWithRetry(userId, retries = 2) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle()
        if (error) throw error
        if (data?.role) return data.role
        if (attempt < retries - 1) {
          await new Promise(r => setTimeout(r, 500))
        }
      } catch {
        if (attempt >= retries - 1) return null
        await new Promise(r => setTimeout(r, 500))
      }
    }
    return null
  }

  async function fetchOnboardingStatus(userId, userRole) {
    if (userRole === 'super_admin' || userRole === 'admin' || userRole === 'collaborator') {
      return true
    }
    try {
      const { data } = await supabase
        .from('public_users')
        .select('onboarding_complete')
        .eq('id', userId)
        .maybeSingle()
      return data?.onboarding_complete || false
    } catch {
      return false
    }
  }

  async function refreshState(sessionUser) {
    if (!sessionUser) {
      setUser(null)
      setRole(null)
      setOnboardingComplete(false)
      return
    }
    setUser(sessionUser)
    const userRole = await fetchRoleWithRetry(sessionUser.id)
    const onboardStatus = await fetchOnboardingStatus(sessionUser.id, userRole)
    setRole(userRole)
    setOnboardingComplete(onboardStatus)
  }

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && mounted) {
          await refreshState(session.user)
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        setLoading(true)
        if (session?.user) {
          await refreshState(session.user)
        } else {
          setUser(null)
          setRole(null)
          setOnboardingComplete(false)
        }
        if (mounted) setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function refreshOnboardingStatus() {
    if (!user) return
    const status = await fetchOnboardingStatus(user.id, role)
    setOnboardingComplete(status)
  }

  async function signOut() {
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (err) {
      console.error('Supabase sign out error:', err)
    } finally {
      setUser(null)
      setRole(null)
      setOnboardingComplete(false)
      window.localStorage.clear()
      window.location.href = '/login'
    }
  }

  function getRedirectPath() {
    if (role === 'super_admin') return '/admin/dashboard'
    if (role === 'admin') return '/admin/dashboard'
    if (role === 'collaborator') return '/admin/my-profile'
    if (role) return '/dashboard'
    return '/login'
  }

  const value = {
    user,
    role,
    loading,
    onboardingComplete,
    setOnboardingComplete,
    refreshOnboardingStatus,
    signOut,
    getRedirectPath,
    isAdmin: role === 'super_admin' || role === 'admin',
    isSuperAdmin: role === 'super_admin',
    isCollaborator: role === 'collaborator',
    isPublicUser: !role,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
