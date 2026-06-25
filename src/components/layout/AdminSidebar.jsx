import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  LayoutDashboard, Briefcase, FileText, ShoppingBag, 
  BookOpen, LayoutTemplate, Info, Share2, Users, 
  ShieldAlert, CreditCard, BrainCircuit, UserCircle, LogOut 
} from 'lucide-react'

export default function AdminSidebar() {
  const { role, signOut } = useAuth()
  const location = useLocation()

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin'] },
    { label: 'Manage Jobs', path: '/admin/manage-jobs', icon: Briefcase, roles: ['super_admin', 'admin'] },
    { label: 'Manage Content', path: '/admin/manage-content', icon: FileText, roles: ['super_admin', 'admin'] },
    { label: 'Manage Products', path: '/admin/manage-products', icon: ShoppingBag, roles: ['super_admin', 'admin'] },
    { label: 'Manage Education', path: '/admin/manage-education', icon: BookOpen, roles: ['super_admin', 'admin'] },
    { label: 'Manage Structure', path: '/admin/manage-structure', icon: LayoutTemplate, roles: ['super_admin', 'admin'] },
    { label: 'Manage About', path: '/admin/manage-about', icon: Info, roles: ['super_admin', 'admin'] },
    { label: 'Manage Socials', path: '/admin/manage-socials', icon: Share2, roles: ['super_admin', 'admin'] },
    { label: 'Manage Collabs', path: '/admin/manage-collaborators', icon: Users, roles: ['super_admin', 'admin'] },
    
    // Founder Only
    { label: 'Manage Team', path: '/admin/manage-team', icon: ShieldAlert, roles: ['super_admin'] },
    { label: 'Payments', path: '/admin/manage-payments', icon: CreditCard, roles: ['super_admin'] },
    { label: 'AI Insights', path: '/admin/ai-insights', icon: BrainCircuit, roles: ['super_admin'] },

    // Collaborator Only
    { label: 'My Profile', path: '/admin/my-profile', icon: UserCircle, roles: ['collaborator'] },
  ]

  const filteredItems = navItems.filter(item => item.roles.includes(role))

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
