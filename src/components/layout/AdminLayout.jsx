/**
 * AdminLayout — sidebar + topbar hybrid layout.
 *
 * Desktop: fixed left sidebar (240 px) + top header strip (role / sign-out).
 * Mobile:  collapsed sidebar behind a drawer, triggered by ☰ in the header.
 *
 * Navigation items are grouped into logical sections so the long flat list
 * becomes scannable.
 */

import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Briefcase, FileText, ShoppingBag,
  BookOpen, LayoutTemplate, Info, Share2, Users, UserCheck,
  ShieldAlert, BarChart3, CreditCard, BrainCircuit, UserCircle,
  GraduationCap, LogOut, Menu, X, Home, AlertTriangle, Megaphone,
  Award, FilePlus2, ChevronRight, Globe, ChevronDown,
} from 'lucide-react'

// ── Navigation tree ────────────────────────────────────────────────────────────
// Each group has a { label, items[] } shape.
// Each item: { label, path, icon, perm }
//   perm: 'super_admin' | 'collaborator' | a permissions[] key

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard',     path: '/admin/dashboard',            icon: LayoutDashboard,  perm: 'super_admin' },
      { label: 'My Profile',    path: '/admin/my-profile',           icon: UserCircle,       perm: 'collaborator' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Jobs',          path: '/admin/manage-jobs',          icon: Briefcase,        perm: 'manage_jobs' },
      { label: 'Content',       path: '/admin/manage-content',       icon: FileText,         perm: 'manage_content' },
      { label: 'Products',      path: '/admin/manage-products',      icon: ShoppingBag,      perm: 'manage_products' },
      { label: 'Education',     path: '/admin/manage-education',     icon: BookOpen,         perm: 'manage_education' },
      { label: 'Scholarships',  path: '/admin/manage-scholarships',  icon: GraduationCap,    perm: 'manage_scholarships' },
      { label: 'Community',     path: '/admin/manage-community',     icon: Globe,            perm: 'manage_community' },
      { label: 'Socials',       path: '/admin/manage-socials',       icon: Share2,           perm: 'manage_socials' },
      { label: 'Collaborators', path: '/admin/manage-collaborators', icon: Users,            perm: 'manage_collaborators' },
    ],
  },
  {
    label: 'Certificates',
    items: [
      { label: 'All Certificates',   path: '/admin/certificates',                      icon: Award,         perm: 'manage_certificates' },
      { label: 'Issue (Custom)',      path: '/admin/certificates/issue',                icon: FilePlus2,     perm: 'manage_certificates' },
      { label: 'Issue Appreciation', path: '/admin/certificates/issue-appreciation',   icon: FilePlus2,     perm: 'manage_certificates' },
      { label: 'Templates',          path: '/admin/certificates/templates',            icon: LayoutTemplate, perm: 'manage_certificates' },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Users',         path: '/admin/users-list',           icon: Users,            perm: 'manage_users' },
      { label: 'Team Members',  path: '/admin/manage-team-members',  icon: UserCheck,        perm: 'manage_team_members' },
      { label: 'Volunteers',    path: '/admin/manage-volunteers',    icon: Users,            perm: 'super_admin' },
      { label: 'Admins',        path: '/admin/manage-team',          icon: ShieldAlert,      perm: 'manage_team' },
    ],
  },
  {
    label: 'Site',
    items: [
      { label: 'About',         path: '/admin/manage-about',         icon: Info,             perm: 'manage_about' },
      { label: 'Structure',     path: '/admin/manage-structure',     icon: LayoutTemplate,   perm: 'manage_structure' },
      { label: 'Stats',         path: '/admin/manage-stats',         icon: BarChart3,        perm: 'manage_stats' },
      { label: 'Popup',         path: '/admin/manage-popup',         icon: LayoutTemplate,   perm: 'super_admin' },
      { label: 'Announcement',  path: '/admin/manage-announcement',  icon: Megaphone,        perm: 'super_admin' },
    ],
  },
  {
    label: 'Finance & AI',
    items: [
      { label: 'Payments',      path: '/admin/manage-payments',      icon: CreditCard,       perm: 'manage_payments' },
      { label: 'AI Insights',   path: '/admin/ai-insights',          icon: BrainCircuit,     perm: 'ai_insights' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Error Logs',    path: '/admin/error-logs',           icon: AlertTriangle,    perm: 'super_admin' },
    ],
  },
]

// ── Permission filter ──────────────────────────────────────────────────────────
function useFilteredGroups() {
  const { permissions, role } = useAuth()
  return NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.perm === 'super_admin') return role === 'super_admin'
      if (item.perm === 'collaborator') return true   // all roles can see their own profile
      if (role === 'super_admin' || role === 'admin') return true
      return permissions.includes(item.perm)
    }),
  })).filter(group => group.items.length > 0)
}

// ── Sidebar inner content ─────────────────────────────────────────────────────
function SidebarContent({ onNavigate }) {
  const location  = useLocation()
  const groups    = useFilteredGroups()
  const { signOut, roleLabel } = useAuth()
  const [collapsed, setCollapsed] = useState({})

  function toggle(label) {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }))
  }

  function isActive(path) {
    if (path === '/admin/dashboard') return location.pathname === path
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/admin/dashboard" onClick={onNavigate} style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#C9993C' }}>CR</span>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 400, fontSize: 14, color: '#CBD5E1', marginLeft: 6 }}>Admin</span>
        </Link>
        <a href="/" style={{ color: '#94A3B8', display: 'flex' }} title="View site">
          <Home size={16} />
        </a>
      </div>

      {/* Role badge */}
      <div style={{ padding: '10px 16px 4px' }}>
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase',
          color: '#C9993C', background: 'rgba(201,153,60,0.12)', padding: '3px 8px', borderRadius: 20,
        }}>{roleLabel}</span>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {groups.map(group => (
          <div key={group.label}>
            {/* Group header */}
            <button
              onClick={() => toggle(group.label)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '8px 16px 4px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#64748B', fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
                textTransform: 'uppercase',
              }}
            >
              {group.label}
              <ChevronDown
                size={12}
                style={{
                  transition: 'transform 0.2s',
                  transform: collapsed[group.label] ? 'rotate(-90deg)' : 'none',
                }}
              />
            </button>

            {/* Group items */}
            {!collapsed[group.label] && group.items.map(item => {
              const active = isActive(item.path)
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 16px',
                    margin: '1px 8px',
                    borderRadius: 8,
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    color: active ? '#E5C46E' : '#94A3B8',
                    background: active ? 'rgba(201,153,60,0.14)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'background 0.15s, color 0.15s',
                    borderLeft: active ? '3px solid #C9993C' : '3px solid transparent',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#CBD5E1' } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8' } }}
                >
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => { onNavigate?.(); signOut() }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '10px 12px', borderRadius: 8,
            border: 'none', background: 'none', cursor: 'pointer',
            color: '#F87171', fontSize: 13, fontWeight: 500,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  )
}

// ── Breadcrumbs ───────────────────────────────────────────────────────────────
function Breadcrumbs() {
  const location = useLocation()
  const parts    = location.pathname.split('/').filter(Boolean)
  const crumbs   = parts.map((part, i) => ({
    label: part.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    path: '/' + parts.slice(0, i + 1).join('/'),
  }))
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', overflowX: 'auto' }}>
      <Link to="/" style={{ color: '#64748B', display: 'flex', textDecoration: 'none' }}><Home size={13} /></Link>
      {crumbs.map((c, i) => (
        <span key={c.path} style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          <ChevronRight size={11} style={{ opacity: 0.4 }} />
          {i === crumbs.length - 1
            ? <span style={{ color: '#F1F5F9', fontWeight: 500 }}>{c.label}</span>
            : <Link to={c.path} style={{ color: '#64748B', textDecoration: 'none' }}>{c.label}</Link>
          }
        </span>
      ))}
    </nav>
  )
}

// ── Main layout ────────────────────────────────────────────────────────────────
const SIDEBAR_W = 240

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  // Automatically close mobile drawer whenever the route changes
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  // Close drawer on ESC key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    if (drawerOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [drawerOpen])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0C1A2E' }}>

      {/* ── Desktop sidebar (sticky in layout flow, never overlays content) ── */}
      <aside
        className="hidden lg:flex flex-col shrink-0 sticky top-0 h-screen z-30"
        style={{
          width: SIDEBAR_W,
          background: '#0A1628',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer overlay (only on < lg screens) ── */}
      {drawerOpen && (
        <div className="lg:hidden">
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)',
            }}
          />
          {/* Drawer panel */}
          <aside
            style={{
              position: 'fixed', top: 0, left: 0, bottom: 0,
              width: SIDEBAR_W, zIndex: 50,
              background: '#0A1628',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', flexDirection: 'column',
              boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ padding: '12px 12px 0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#94A3B8', padding: 6, borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Main area (flex-1 naturally flows next to the sidebar on desktop, full width on mobile) ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: '100vh',
        }}
      >
        {/* Top header bar */}
        <header
          style={{
            position: 'sticky', top: 0, zIndex: 20,
            height: 56, display: 'flex', alignItems: 'center',
            padding: '0 24px', gap: 12,
            background: 'rgba(10,22,40,0.92)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Hamburger — mobile only */}
          <button
            className="lg:hidden"
            onClick={() => setDrawerOpen(true)}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer', color: '#CBD5E1', padding: 7, borderRadius: 8,
              display: 'flex', alignItems: 'center',
            }}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>

          <Breadcrumbs />
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '28px 24px 48px', minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
