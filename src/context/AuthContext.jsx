import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [onboardingComplete, setOnboardingComplete] = useState(false)

  // Fetch role from user_roles table
  async function fetchRole(userId) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error
      return data?.role || null
    } catch {
      return null
    }
  }

  // Fetch onboarding status (skip for admin roles)
  async function fetchOnboardingStatus(userId, userRole) {
    // Admins don't need onboarding
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

  // Initialize session
  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && mounted) {
          setUser(session.user)
          const userRole = await fetchRole(session.user.id)
          const onboardStatus = await fetchOnboardingStatus(session.user.id, userRole)
          if (mounted) {
            setRole(userRole)
            setOnboardingComplete(onboardStatus)
          }
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        if (session?.user) {
          setUser(session.user)
          const userRole = await fetchRole(session.user.id)
          const onboardStatus = await fetchOnboardingStatus(session.user.id, userRole)
          if (mounted) {
            setRole(userRole)
            setOnboardingComplete(onboardStatus)
          }
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

  // Called by Onboarding page after completing setup
  async function refreshOnboardingStatus() {
    if (!user) return
    const status = await fetchOnboardingStatus(user.id, role)
    setOnboardingComplete(status)
  }

  // Fully clean sign out with hard fallback to login
  async function signOut() {
    try {
      // 1. Terminate session globally and locally on Supabase
      await supabase.auth.signOut({ scope: 'local' })
    } catch (err) {
      console.error('Supabase sign out error:', err)
    } finally {
      // 2. Wipe memory states immediately
      setUser(null)
      setRole(null)
      setOnboardingComplete(false)
      
      // 3. Purge browser's lingering memory caches
      window.localStorage.clear()
      
      // 4. Force a clean, hard reload away from protected paths to break loops
      window.location.href = '/login'
    }
  }

  // Get redirect path based on role
  function getRedirectPath() {
    if (!role) return '/dashboard'          // public user (no row in user_roles)
    if (role === 'super_admin') return '/admin/dashboard'
    if (role === 'admin') return '/admin/dashboard'
    if (role === 'collaborator') return '/admin/my-profile'
    return '/dashboard'
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