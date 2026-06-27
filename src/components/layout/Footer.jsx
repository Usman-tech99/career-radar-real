import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { MessageCircle, Youtube, Instagram, Linkedin, Twitter, Send, Users as UsersIcon, Globe } from 'lucide-react'
import logo from '../../assets/logo.png'

const platformIcons = {
  whatsapp: MessageCircle,
  youtube: Youtube,
  instagram: Instagram,
  telegram: Send,
  linkedin: Linkedin,
  twitter: Twitter,
  discord: UsersIcon,
  tiktok: UsersIcon,
  facebook: UsersIcon,
  other: Globe,
}

export default function Footer() {
  const [socials, setSocials] = useState([])
  const [about, setAbout] = useState(null)

  useEffect(() => {
    async function fetchFooterData() {
      const [socRes, abRes] = await Promise.all([
        supabase.from('socials').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('about_page').select('contact_email, tagline, founded_date').eq('id', 1).single()
      ])
      
      if (socRes.data) setSocials(socRes.data)
      if (abRes.data) setAbout(abRes.data)
    }
    fetchFooterData()
  }, [])

  return (
    <footer className="bg-surface border-t border-border mt-20 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
          
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="relative shrink-0">
                <div className="absolute -inset-4 bg-[#00FF66]/10 rounded-full blur-[30px] animate-pulse" />
                <div className="absolute -inset-3 bg-[#00FF00]/15 rounded-full blur-[20px]" />
                <div className="absolute -inset-2 rounded-full border border-[#00FF66]/40 shadow-[0_0_20px_4px_rgba(0,255,102,0.3),inset_0_0_12px_2px_rgba(0,255,102,0.15)]" />
                <div className="absolute -inset-0.5 rounded-full border border-[#00FF66]/20" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#00FF66]/10 to-transparent" />
                <img src={logo} alt="Career Radar" className="relative h-10 w-10 brightness-125 drop-shadow-[0_0_12px_rgba(0,255,102,0.6)_0_0_24px_rgba(0,255,102,0.3)]" />
              </div>
              <span className="font-sora font-bold text-2xl tracking-tight text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]">
                Career <span className="text-[#00FF66] drop-shadow-[0_0_12px_rgba(0,255,102,0.6)]">Radar</span>
              </span>
            </Link>
            <p className="text-muted text-sm max-w-sm mb-6">
              {about?.tagline || "Your AI-powered career GPS. Navigate the future of work with confidence."}
            </p>
            {about?.contact_email && (
              <p className="text-sm font-medium">
                <a href={`mailto:${about.contact_email}`} className="text-white hover:text-green transition-colors">
                  {about.contact_email}
                </a>
              </p>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white mb-6">Explore</h4>
            <ul className="space-y-4">
              <li><Link to="/jobs" className="text-sm text-muted hover:text-white transition-colors">Jobs Board</Link></li>
              <li><Link to="/weekly-content" className="text-sm text-muted hover:text-white transition-colors">Resources</Link></li>
              <li><Link to="/education" className="text-sm text-muted hover:text-white transition-colors">Courses</Link></li>
              <li><Link to="/scholarships" className="text-sm text-muted hover:text-white transition-colors">Scholarships</Link></li>
              <li><Link to="/shop" className="text-sm text-muted hover:text-white transition-colors">Shop</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold text-white mb-6">Company</h4>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-sm text-muted hover:text-white transition-colors">Our Story</Link></li>
              <li><Link to="/structure" className="text-sm text-muted hover:text-white transition-colors">Aim & Vision</Link></li>
              <li><Link to="/team" className="text-sm text-muted hover:text-white transition-colors">The Team</Link></li>
              <li><Link to="/collaborators" className="text-sm text-muted hover:text-white transition-colors">Partners</Link></li>
            </ul>
          </div>

          {/* Socials Column */}
          <div>
            <h4 className="font-bold text-white mb-6">Socials</h4>
            {socials.length === 0 ? (
              <p className="text-xs text-muted">Follow us on social media.</p>
            ) : (
              <ul className="space-y-3">
                {socials.map(social => {
                  const Icon = platformIcons[social.platform_type] || Globe
                  return (
                    <li key={social.id}>
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors"
                      >
                        <Icon size={16} className="shrink-0" />
                        <span>{social.platform_name}</span>
                        {social.members_count && (
                          <span className="text-[10px] text-green bg-green/10 px-1.5 py-0.5 rounded-full">{social.members_count}</span>
                        )}
                      </a>
                    </li>
                  )
                })}
              </ul>
            )}
            <Link to="/social" className="inline-block mt-4 text-xs text-green hover:underline">View all →</Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 flex-wrap">
            {socials.slice(0, 6).map(social => {
              const Icon = platformIcons[social.platform_type] || Globe
              return (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted hover:text-white transition-colors"
                  title={social.platform_name}
                >
                  <Icon size={18} />
                </a>
              )
            })}
          </div>
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} Career Radar. Founded {about?.founded_date || '2024'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}