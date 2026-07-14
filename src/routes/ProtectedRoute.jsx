import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PATH_PERMISSIONS = {
  '/admin/manage-jobs': 'manage_jobs',
  '/admin/manage-content': 'manage_content',
  '/admin/manage-products': 'manage_products',
  '/admin/manage-education': 'manage_education',
  '/admin/manage-scholarships': 'manage_scholarships',
  '/admin/manage-about': 'manage_about',
  '/admin/manage-community': 'manage_community',
  '/admin/manage-socials': 'manage_socials',
  '/admin/manage-collaborators': 'manage_collaborators',
  '/admin/manage-structure': 'manage_structure',
  '/admin/manage-stats': 'manage_stats',
  '/admin/manage-team': 'manage_team',
  '/admin/users-list': 'manage_users',
  '/admin/manage-team-members': 'manage_team_members',
  '/admin/manage-payments': 'manage_payments',
  '/admin/ai-insights': 'ai_insights',
}

export function ProtectedRoute({ allowedRoles }) {
  const { user, role, permissions, loading, roleChecked } = useAuth()
  const location = useLocation()

  if (loading || !roleChecked) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  if (role !== 'super_admin') {
    const requiredPerm = PATH_PERMISSIONS[location.pathname]
    if (requiredPerm && !permissions.includes(requiredPerm)) {
      return <Navigate to="/admin/dashboard" replace />
    }
  }

  return <Outlet />
}
