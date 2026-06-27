import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [roleChecked, setRoleChecked] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState(false)

  async function fetchRoleWithRetry(userId, retries = 3) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle()
        if (error) {
          console.error(`Auth: fetchRole attempt ${attempt + 1} failed:`, error.message, 'code:', error.code, 'details:', error.details)
          throw error
        }
        if (data?.role) return data.role
        if (attempt < retries - 1) {
          await new Promise(r => setTimeout(r, 600))
        }
      } catch (err) {
        if (attempt >= retries - 1) {
          console.error('Auth: all role fetch attempts exhausted for user', userId)
          return null
        }
        await new Promise(r => setTimeout(r, 600))
      }
    }
    return null
  }

  async function fetchOnboardingStatus(userId, userRole) {
    if (userRole === 'super_admin' || userRole === 'admin' || userRole === 'collaborator') {
      return true
    }
    try {
      const { data, error } = await supabase
        .from('public_users')
        .select('onboarding_complete')
        .eq('id', userId)
        .maybeSingle()
      if (error) {
        console.error('Auth: fetchOnboardingStatus query error:', error.message, error.code, error.details)
        return false
      }
      const status = data?.onboarding_complete || false
      return status
    } catch (err) {
      console.error('Auth: fetchOnboardingStatus exception:', err)
      return false
    }
  }

  async function refreshState(sessionUser) {
    if (!sessionUser) {
      setUser(null)
      setRole(null)
      setOnboardingComplete(false)
      setRoleChecked(true)
      return
    }
    setUser(sessionUser)
    setRoleChecked(false)
    const userRole = await fetchRoleWithRetry(sessionUser.id)
    const onboardStatus = await fetchOnboardingStatus(sessionUser.id, userRole)
    setRole(userRole)
    setOnboardingComplete(onboardStatus)
    setRoleChecked(true)
  }

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && mounted) {
          await refreshState(session.user)
        } else if (mounted) {
          setRoleChecked(true)
        }
      } catch (err) {
        console.error('Auth init error:', err)
        if (mounted) setRoleChecked(true)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        if (event === 'TOKEN_REFRESHED') return
        if (session?.user) {
          await refreshState(session.user)
        } else {
          setUser(null)
          setRole(null)
          setOnboardingComplete(false)
          setRoleChecked(true)
        }
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
    return status
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
      setRoleChecked(true)
      window.localStorage.clear()
      window.location.href = '/'
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
    roleChecked,
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
