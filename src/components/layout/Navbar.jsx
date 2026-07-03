import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Menu, X, User, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import logo from '../../assets/logo.png'

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
    '/donate': '/donate',
    '/social': '/dashboard/socials',
  }

  const links = [
    { name: 'Home', path: user ? dashMap['/'] : '/' },
    { name: 'Jobs', path: user ? dashMap['/jobs'] : '/jobs' },
    { name: 'Resources', path: user ? dashMap['/weekly-content'] : '/weekly-content' },
    { name: 'Education', path: user ? dashMap['/education'] : '/education' },
    { name: 'Scholarships', path: user ? dashMap['/scholarships'] : '/scholarships' },
    { name: 'Products', path: user ? dashMap['/products'] : '/products' },
    { name: 'Team', path: user ? dashMap['/team'] : '/team' },
    { name: 'About', path: user ? dashMap['/about'] : '/about' },
    { name: 'Support Us', path: user ? '/dashboard/donate' : '/donate' },
    { name: 'Socials', path: user ? dashMap['/social'] : '/social' },
  ]

  const { theme, toggleTheme } = useTheme()

  // If user is logged in, their dashboard path depends on role
  let dashPath = '/dashboard'
  if (role === 'super_admin' || role === 'admin') dashPath = '/admin/dashboard'
  else if (role === 'collaborator') dashPath = '/admin/my-profile'

  return (
    <nav className="fixed top-0 w-full z-40 bg-[#07070C]/80 backdrop-blur-md border-b border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="relative shrink-0">
            <div className="absolute -inset-4 bg-[#00FF66]/10 rounded-full blur-[30px] animate-pulse" />
            <div className="absolute -inset-3 bg-[#00FF00]/15 rounded-full blur-[20px]" />
            <div className="absolute -inset-2 rounded-full border border-[#00FF66]/40 shadow-[0_0_20px_4px_rgba(0,255,102,0.3),inset_0_0_12px_2px_rgba(0,255,102,0.15)]" />
            <div className="absolute -inset-0.5 rounded-full border border-[#00FF66]/20" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#00FF66]/10 to-transparent" />
            <img src={logo} alt="  Career Radar" className="relative h-10 w-10 brightness-125 drop-shadow-[0_0_12px_rgba(0,255,102,0.6)_0_0_24px_rgba(0,255,102,0.3)]" />
          </div>
          <span className="font-sora font-bold text-xl tracking-tight text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]">
            Career <span className="text-[#00FF66] drop-shadow-[0_0_12px_rgba(0,255,102,0.6)]">Radar</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {links.map(link => (
            <Link 
              key={link.path} 
              to={link.path}
              className={`text-sm font-medium transition-colors hover:text-green ${
                location.pathname === link.path ? 'text-green' : 'text-muted'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Theme Toggle */}
          <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-white/[0.04] transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun size={18} className="text-muted" /> : <Moon size={18} className="text-muted" />}
          </button>
          {user ? (
            <Link to={dashPath} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
              <User size={16} /> Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium hover:text-green transition-colors" style={{color: 'var(--color-white)'}}>Login</Link>
              <Link to="/register" className="btn-primary py-2 px-4 text-sm">Join Free</Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button className="lg:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
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
            <div className="px-4 py-6 space-y-4 flex flex-col">
              {links.map(link => (
                <Link 
                  key={link.path} 
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-lg font-medium ${location.pathname === link.path ? 'text-green' : 'text-white'}`}
                >
                  {link.name}
                </Link>
              ))}
              <hr className="border-border my-4" />
              <button onClick={() => { toggleTheme(); setIsOpen(false) }}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-border text-sm font-medium transition-colors"
                style={{color: 'var(--color-muted)'}}>
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
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
