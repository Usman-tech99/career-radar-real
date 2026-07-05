import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RequirePermission({ permission, children }) {
  const { user, role, permissions, loading, roleChecked } = useAuth()

  if (loading || !roleChecked) {
    return (
      <div className="min-h-screen bg-[#07070C] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (role === 'super_admin') return children
  if (!permissions.includes(permission)) return <Navigate to="/admin/dashboard" replace />

  return children
}
