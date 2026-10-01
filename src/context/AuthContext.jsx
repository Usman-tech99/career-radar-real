import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [roleLabel, setRoleLabel] = useState('')
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [roleChecked, setRoleChecked] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const initialLoadDone = useRef(false)

  async function fetchRoleWithRetry(userId, retries = 3) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role, role_label, permissions')
          .eq('user_id', userId)
          .maybeSingle()
        if (error) {
          console.error(`Auth: fetchRole attempt ${attempt + 1} failed:`, error.message)
          throw error
        }
        if (data?.role) return data
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
        console.error('Auth: fetchOnboardingStatus query error:', error.message)
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
      setRoleLabel('')
      setPermissions([])
      setOnboardingComplete(false)
      setRoleChecked(true)
      return
    }
    setUser(sessionUser)
    if (initialLoadDone.current) setRoleChecked(false)
    const roleData = await fetchRoleWithRetry(sessionUser.id)
    const userRole = roleData?.role || null
    setRole(userRole)
    setRoleLabel(roleData?.role_label || '')
    let perms = roleData?.permissions
    if (typeof perms === 'string') {
      try { perms = JSON.parse(perms) } catch { perms = [] }
    }
    if (!Array.isArray(perms)) perms = []
    if (userRole === 'super_admin') {
      const allPermissions = [
        'manage_jobs', 'manage_content', 'manage_products', 'manage_education',
        'manage_scholarships', 'manage_about', 'manage_community', 'manage_socials',
        'manage_collaborators', 'manage_structure', 'manage_stats', 'manage_team', 'manage_users', 'manage_team_members',
        'manage_payments', 'ai_insights', 'manage_certificates'
      ]
      setPermissions(allPermissions)
    } else if (userRole === 'admin' && perms.length === 0) {
      const defaultAdminPermissions = [
        'manage_jobs', 'manage_content', 'manage_products', 'manage_education',
        'manage_scholarships', 'manage_about', 'manage_community', 'manage_socials',
        'manage_collaborators', 'manage_certificates'
      ]
      setPermissions(defaultAdminPermissions)
    } else {
      setPermissions(perms)
    }
    const onboardStatus = await fetchOnboardingStatus(sessionUser.id, userRole)
    setOnboardingComplete(onboardStatus)
    setRoleChecked(true)
  }

  useEffect(() => {
    let mounted = true
    let trackedUserId = null

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && mounted) {
          trackedUserId = session.user.id
          await refreshState(session.user)
        } else if (mounted) {
          setRoleChecked(true)
        }
      } catch (err) {
        console.error('Auth init error — clearing corrupted session')
        try {
          const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-'))
          keys.forEach(k => localStorage.removeItem(k))
          if (mounted) supabase.auth.signOut().catch(() => {})
        } catch {}
        if (mounted) setRoleChecked(true)
      } finally {
        if (mounted) initialLoadDone.current = true
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        if (event === 'TOKEN_REFRESHED') return
        if (session?.user) {
          if (trackedUserId === session.user.id) return
          trackedUserId = session.user.id
          await refreshState(session.user)
        } else {
          trackedUserId = null
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
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Supabase sign out error:', err)
    }
    setUser(null)
    setRole(null)
    setRoleLabel('')
    setPermissions([])
    setOnboardingComplete(false)
    setRoleChecked(true)
    window.location.href = '/'
  }

  function getRedirectPath() {
    if (role === 'super_admin') return '/admin/dashboard'
    if (role === 'admin') return '/admin/dashboard'
    if (role === 'collaborator') return '/admin/my-profile'
    if (user && !role) return '/onboarding'
    if (role) return '/dashboard'
    return '/login'
  }

  const value = {
    user,
    role,
    roleLabel,
    permissions,
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
    isPublicUser: !user,
    hasPermission: (perm) => permissions.includes(perm),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
