import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Menu, X, User, ChevronDown } from 'lucide-react'
import logo from '../../assets/logo.jpeg'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function NavDropdown({ label, items }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-navy-dark text-navy whitespace-nowrap"
      >
        {label} <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-48 bg-surface border border-border rounded-xl py-2 shadow-2xl"
          >
            {items.map(item => {
              const ItemIcon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  {ItemIcon && <ItemIcon size={16} className="text-muted/60" />}
                  {item.name}
                </Link>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Navbar() {
  const { user, role } = useAuth()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const dashMap = {
    '/': '/dashboard',
    '/jobs': '/dashboard/jobs',
    '/weekly-content': '/dashboard/resources',
    '/education': '/dashboard/education',
    '/scholarships': '/dashboard/scholarships',
    '/products': '/dashboard/products',
    '/team': '/dashboard/team',
    '/about': '/dashboard/about',
    '/community': '/dashboard/community',
    '/donate': '/donate',
    '/social': '/dashboard/socials',
  }

  const navItems = [
    { name: 'Home', path: user ? dashMap['/'] : '/' },
    {
      name: 'Opportunities',
      children: [
        { name: 'Jobs', path: user ? dashMap['/jobs'] : '/jobs', icon: null },
        { name: 'Scholarships', path: user ? dashMap['/scholarships'] : '/scholarships', icon: null },
      ],
    },
    {
      name: 'Resources',
      children: [
        { name: 'Education', path: user ? dashMap['/education'] : '/education', icon: null },
        { name: 'Tech Courses', path: user ? dashMap['/products'] : '/products', icon: null },
        { name: 'Weekly Content', path: user ? dashMap['/weekly-content'] : '/weekly-content', icon: null },
      ],
    },
    {
      name: 'Community',
      children: [
        { name: 'Community', path: user ? dashMap['/community'] : '/community', icon: null },
        { name: 'Social', path: user ? dashMap['/social'] : '/social', icon: null },
      ],
    },
    {
      name: 'About',
      children: [
        { name: 'About', path: user ? dashMap['/about'] : '/about', icon: null },
        { name: 'Team', path: user ? dashMap['/team'] : '/team', icon: null },
        { name: 'Collaborators', path: '/collaborators', icon: null },
      ],
    },
    { name: 'Support Us', path: user ? '/dashboard/donate' : '/donate' },
    { name: 'Radar AI', path: '/' },
  ]

  let dashPath = '/dashboard'
  if (role === 'super_admin' || role === 'admin') dashPath = '/admin/dashboard'
  else if (role === 'collaborator') dashPath = '/admin/my-profile'

  const isActive = (path) => location.pathname === path

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-amber-400 border-b border-amber-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-14 h-14 rounded-full border-2 border-navy overflow-hidden bg-white flex items-center justify-center">
            <img src={logo} alt="Career Radar" className="w-full h-full object-cover" />
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map(item => {
            if (item.children) {
              return <NavDropdown key={item.name} label={item.name} items={item.children} />
            }
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 text-sm font-medium transition-colors hover:text-navy-dark whitespace-nowrap ${
                  isActive(item.path) ? 'text-navy-dark' : 'text-navy'
                }`}
              >
                {item.name}
              </Link>
            )
          })}
        </div>

        {/* Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <Link to={dashPath} className="bg-navy text-slate-100 font-semibold py-2 px-4 rounded-xl text-sm flex items-center gap-2 hover:bg-navy-light transition-colors">
              <User size={16} /> Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium hover:text-navy-dark transition-colors px-2 text-navy">Login</Link>
              <Link to="/register" className="bg-navy text-slate-100 font-semibold py-2 px-4 rounded-xl text-sm hover:bg-navy-light transition-colors">Join Free</Link>
            </>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="lg:hidden flex items-center gap-1.5 shrink-0">
          {user ? (
            <Link to={dashPath} className="bg-navy text-slate-100 font-semibold py-1.5 px-2 rounded-xl text-xs flex items-center gap-1">
              <User size={13} /> Dash
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-xs font-medium hover:text-navy-dark transition-colors px-1.5 text-navy">Login</Link>
              <Link to="/register" className="bg-navy text-slate-100 font-semibold py-1.5 px-2 rounded-xl text-xs whitespace-nowrap">Join Free</Link>
            </>
          )}
          <button className="text-navy p-1.5" onClick={() => setIsOpen(!isOpen)} aria-label={isOpen ? "Close menu" : "Open menu"}>
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden bg-surface border-b border-border overflow-hidden"
          >
            <div className="px-4 py-6 space-y-3 flex flex-col">
              {navItems.map(item => {
                if (item.children) {
                  return (
                    <div key={item.name}>
                      <div className="text-sm font-semibold text-muted uppercase tracking-wider px-2 py-1">{item.name}</div>
                      {item.children.map(child => (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setIsOpen(false)}
                          className={`block px-4 py-2 text-lg font-medium ${isActive(child.path) ? 'text-gold' : 'text-white'}`}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )
                }
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`text-lg font-medium ${isActive(item.path) ? 'text-gold' : 'text-white'}`}
                  >
                    {item.name}
                  </Link>
                )
              })}
              {user ? (
                <Link to={dashPath} onClick={() => setIsOpen(false)} className="btn-primary w-full text-center py-3">
                  Dashboard
                </Link>
              ) : (
                <div className="flex gap-4">
                  <Link to="/login" onClick={() => setIsOpen(false)} className="btn-ghost flex-1 text-center py-3">Login</Link>
                  <Link to="/register" onClick={() => setIsOpen(false)} className="btn-primary flex-1 text-center py-3">Join Free</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
