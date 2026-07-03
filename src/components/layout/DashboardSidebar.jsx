import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Target, Activity, FileText, User, LogOut,
  Briefcase, GraduationCap, BookOpen, ShoppingBag, Users, Info, Share2, HandshakeIcon, Building2, Heart
} from 'lucide-react'

const primaryNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/dashboard/blueprint', icon: Target, label: 'AI Blueprint' },
  { to: '/dashboard/score', icon: Activity, label: 'Career Score' },
  { to: '/dashboard/resume', icon: FileText, label: 'Resume Builder' },
  { to: '/dashboard/profile', icon: User, label: 'Profile Settings' },
]

const exploreNav = [
  { to: '/dashboard/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/dashboard/scholarships', icon: GraduationCap, label: 'Scholarships' },
  { to: '/dashboard/education', icon: BookOpen, label: 'Education' },
  { to: '/dashboard/products', icon: ShoppingBag, label: 'Products' },
  { to: '/dashboard/resources', icon: FileText, label: 'Resources' },
  { to: '/dashboard/team', icon: Users, label: 'Team' },
  { to: '/dashboard/about', icon: Info, label: 'About' },
  { to: '/dashboard/socials', icon: Share2, label: 'Socials' },
  { to: '/dashboard/collaborators', icon: HandshakeIcon, label: 'Collaborators' },
  { to: '/dashboard/structure', icon: Building2, label: 'Structure' },
  { to: '/dashboard/donate', icon: Heart, label: 'Support Us' },
]

function NavItem({ to, icon: Icon, label }) {
  const location = useLocation()
  const isActive = location.pathname === to
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 font-medium relative ${
      isActive ? 'text-green' : 'text-muted hover:bg-white/[0.04] hover:text-white'
    }`}>
      {isActive && (
        <motion.div layoutId="dashNav" className="absolute inset-0 rounded-xl bg-green/10 border border-green/20" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
      )}
      <Icon size={18} className="relative z-10 shrink-0" />
      <span className="relative z-10 text-sm">{label}</span>
    </Link>
  )
}

export default function DashboardSidebar() {
  const { signOut } = useAuth()
  const location = useLocation()
  const inExplore = exploreNav.some(n => n.to === location.pathname)

  return (
    <div className="w-64 h-screen bg-[#0A0A12]/90 backdrop-blur-xl border-r border-white/[0.05] flex flex-col fixed left-0 top-0 pt-20 z-20">
      <div className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {primaryNav.map(s => <NavItem key={s.to} {...s} />)}
        <div className="my-3 border-t border-white/[0.05] pt-3">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted/50 mb-2">Explore Site</p>
          {exploreNav.map(s => <NavItem key={s.to} {...s} />)}
        </div>
      </div>
      <div className="p-3 border-t border-white/[0.05] shrink-0">
        <button type="button" onClick={signOut}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 font-medium text-sm">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  )
}
