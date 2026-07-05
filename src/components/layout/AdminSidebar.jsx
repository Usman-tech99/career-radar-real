import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  LayoutDashboard, Briefcase, FileText, ShoppingBag, 
  BookOpen, LayoutTemplate, Info, Share2, Users, UserCheck,
  ShieldAlert, CreditCard, BrainCircuit, UserCircle, GraduationCap, LogOut, Globe
} from 'lucide-react'

export default function AdminSidebar() {
  const { permissions, roleLabel, role, signOut } = useAuth()
  const location = useLocation()

  const navItems = [
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
    { label: 'Manage Team', path: '/admin/manage-team', icon: ShieldAlert, perm: 'manage_team' },
    { label: 'Team Members', path: '/admin/manage-team-members', icon: UserCheck, perm: 'manage_team_members' },
    { label: 'Payments', path: '/admin/manage-payments', icon: CreditCard, perm: 'manage_payments' },
    { label: 'AI Insights', path: '/admin/ai-insights', icon: BrainCircuit, perm: 'ai_insights' },
    { label: 'My Profile', path: '/admin/my-profile', icon: UserCircle, perm: 'collaborator' },
  ]

  const filteredItems = navItems.filter(item => {
    if (item.perm === 'super_admin') return role === 'super_admin'
    if (item.perm === 'collaborator') return role === 'collaborator' || permissions.length === 0
    return permissions.includes(item.perm)
  })

  return (
    <div className="w-64 h-screen bg-surface border-r border-border flex flex-col fixed left-0 top-0 pt-20">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {filteredItems.map(item => {
          const active = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                active 
                ? 'bg-green/10 text-green border border-green/20' 
                : 'text-muted hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <item.icon size={20} className={active ? 'text-green' : 'text-muted'} />
              {item.label}
            </Link>
          )
        })}
      </div>
      <div className="p-4 border-t border-border">
        <button 
          type="button"
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-colors font-medium"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
