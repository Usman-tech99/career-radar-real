import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'
import {
  LayoutDashboard, Briefcase, FileText, ShoppingBag,
  BookOpen, LayoutTemplate, Info, Share2, Users, UserCheck,
  ShieldAlert, BarChart3, CreditCard, BrainCircuit, UserCircle,
  GraduationCap, LogOut, Menu, X, ChevronRight, Home, Globe, AlertTriangle, Megaphone
} from 'lucide-react'

const ALL_NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, perm: 'super_admin' },
  { label: 'Manage Jobs', path: '/admin/manage-jobs', icon: Briefcase, perm: 'manage_jobs' },
  { label: 'Manage Content', path: '/admin/manage-content', icon: FileText, perm: 'manage_content' },
  { label: 'Manage Products', path: '/admin/manage-products', icon: ShoppingBag, perm: 'manage_products' },
  { label: 'Manage Education', path: '/admin/manage-education', icon: BookOpen, perm: 'manage_education' },
  { label: 'Manage Scholarships', path: '/admin/manage-scholarships', icon: GraduationCap, perm: 'manage_scholarships' },
  { label: 'Manage Structure', path: '/admin/manage-structure', icon: LayoutTemplate, perm: 'manage_structure' },
  { label: 'Manage About', path: '/admin/manage-about', icon: Info, perm: 'manage_about' },
  { label: 'Manage Community', path: '/admin/manage-community', icon: Globe, perm: 'manage_community' },
  { label: 'Manage Socials', path: '/admin/manage-socials', icon: Share2, perm: 'manage_socials' },
  { label: 'Manage Collabs', path: '/admin/manage-collaborators', icon: Users, perm: 'manage_collaborators' },
  { label: 'Manage Stats', path: '/admin/manage-stats', icon: BarChart3, perm: 'manage_stats' },
  { label: 'Manage Admins', path: '/admin/manage-team', icon: ShieldAlert, perm: 'manage_team' },
  { label: 'Users List', path: '/admin/users-list', icon: Users, perm: 'manage_users' },
  { label: 'Team Members', path: '/admin/manage-team-members', icon: UserCheck, perm: 'manage_team_members' },
  { label: 'Payments', path: '/admin/manage-payments', icon: CreditCard, perm: 'manage_payments' },
  { label: 'AI Insights', path: '/admin/ai-insights', icon: BrainCircuit, perm: 'ai_insights' },
  { label: 'Manage Popup', path: '/admin/manage-popup', icon: LayoutTemplate, perm: 'super_admin' },
  { label: 'Announcement', path: '/admin/manage-announcement', icon: Megaphone, perm: 'super_admin' },
  { label: 'Error Logs', path: '/admin/error-logs', icon: AlertTriangle, perm: 'super_admin' },
  { label: 'Volunteers', path: '/admin/manage-volunteers', icon: Users, perm: 'super_admin' },
  { label: 'My Profile', path: '/admin/my-profile', icon: UserCircle, perm: 'collaborator' },
]

export default function AdminLayout() {
  const { permissions, roleLabel, role, signOut } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const filteredItems = ALL_NAV_ITEMS.filter(item => {
    if (item.perm === 'super_admin') return role === 'super_admin'
    if (item.perm === 'collaborator') return role === 'collaborator' || role === 'admin' || role === 'super_admin'
    if (role === 'super_admin') return true
    return permissions.includes(item.perm)
  })

  const activeItem = filteredItems.find(item => location.pathname === item.path)

  // Breadcrumbs from path
  const pathParts = location.pathname.split('/').filter(Boolean)
  const breadcrumbs = pathParts.map((part, i) => ({
    label: part.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    path: '/' + pathParts.slice(0, i + 1).join('/'),
  }))

  function NavLink({ item, onClick, mobile }) {
    const active = location.pathname === item.path
    return (
      <Link
        to={item.path}
        onClick={() => { if (onClick) onClick() }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
          mobile ? 'whitespace-normal' : 'whitespace-nowrap'
        } ${
          active
            ? 'bg-green/10 text-green'
            : 'text-muted hover:text-white hover:bg-white/[0.04]'
        }`}
      >
        <item.icon size={16} />
        <span className={mobile ? 'inline' : 'hidden lg:inline'}>{item.label}</span>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top Navbar */}
      <div className="admin-topbar fixed top-0 left-0 right-0 z-40 h-16 bg-surface border-b border-border flex items-center px-4 sm:px-6 gap-3">
        <button type="button" className="lg:hidden p-2 rounded-lg hover:bg-white/[0.04] transition-colors" onClick={() => setMobileOpen(true)}>
          <Menu size={20} className="text-muted" />
        </button>

        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="font-sora font-bold text-lg tracking-tight">
            <span className="text-green">CR</span>{' '}
            <span className="hidden sm:inline text-muted font-normal text-sm">Admin</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1 flex-1 overflow-x-auto scrollbar-none ml-4">
          {filteredItems.map(item => (
            <NavLink key={item.path} item={item} />
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted hidden sm:inline">{roleLabel}</span>
          <button
            type="button"
            onClick={signOut}
            className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-surface border-r border-border overflow-y-auto lg:hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="font-sora font-bold text-lg">
                <span className="text-green">CR</span> Admin
              </span>
              <button type="button" onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-white/[0.04] cursor-pointer">
                <X size={20} className="text-muted pointer-events-none" />
              </button>
            </div>
            <div className="p-4 space-y-1">
              {filteredItems.map(item => (
                <NavLink key={item.path} item={item} onClick={() => setMobileOpen(false)} mobile />
              ))}
            </div>
            <div className="p-4 border-t border-border mt-4">
              <button
                type="button"
                onClick={() => { signOut(); setMobileOpen(false) }}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-colors font-medium"
              >
                <LogOut size={20} />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Breadcrumbs */}
      <div className="pt-20 px-4 sm:px-6 lg:px-8 print:hidden">
        <nav className="admin-breadcrumbs flex items-center gap-2 text-sm text-muted mb-6 overflow-x-auto scrollbar-none">
          <Link to="/" className="hover:text-white transition-colors shrink-0">
            <Home size={14} />
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-2 shrink-0">
              <ChevronRight size={12} className="opacity-50" />
              {i === breadcrumbs.length - 1 ? (
                <span className="text-white font-medium">{crumb.label}</span>
              ) : (
                <Link to={crumb.path} className="hover:text-white transition-colors">{crumb.label}</Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Page content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-8">
        <Outlet />
      </main>
    </div>
  )
}
