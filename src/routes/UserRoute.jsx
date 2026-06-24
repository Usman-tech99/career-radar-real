import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function UserRoute() {
  const { user, role, loading, onboardingComplete } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070C] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // Admin users shouldn't access /dashboard
  if (role === 'super_admin' || role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  // Collaborators shouldn't access /dashboard
  if (role === 'collaborator') {
    return <Navigate to="/admin/my-profile" replace />
  }

  // If logged in but onboarding not done, go to onboarding
  if (!onboardingComplete) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
