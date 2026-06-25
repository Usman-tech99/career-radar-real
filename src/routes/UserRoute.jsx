import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function UserRoute() {
  const { user, role, loading: authLoading, onboardingComplete, setOnboardingComplete } = useAuth()
  const [checkingDatabase, setCheckingDatabase] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function verifyOnboardingFromDB() {
      if (onboardingComplete) {
        setHasProfile(true)
        setCheckingDatabase(false)
        return
      }

      if (!user?.id) {
        setCheckingDatabase(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('public_users')
          .select('onboarding_complete')
          .eq('id', user.id)
          .maybeSingle()

        if (data?.onboarding_complete && isMounted) {
          setHasProfile(true)
          if (setOnboardingComplete) {
            setOnboardingComplete(true)
          }
        }
      } catch (err) {
        console.error("Database route verification failed:", err)
      } finally {
        if (isMounted) {
          setCheckingDatabase(false)
        }
      }
    }

    if (!authLoading) {
      verifyOnboardingFromDB()
    }

    return () => {
      isMounted = false
    }
  }, [user, authLoading, onboardingComplete, setOnboardingComplete])

  if (authLoading || checkingDatabase) {
    return (
      <div className="min-h-screen bg-[#07070C] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (role === 'super_admin' || role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (role === 'collaborator') {
    return <Navigate to="/admin/my-profile" replace />
  }

  if (!onboardingComplete && !hasProfile) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
