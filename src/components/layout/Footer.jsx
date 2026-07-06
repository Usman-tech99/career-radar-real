import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { MessageCircle, Youtube, Instagram, Linkedin, Twitter, Send, Users as UsersIcon, Globe, Mail, Handshake } from 'lucide-react'

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

  useEffect(() => {
    supabase.from('socials').select('*').eq('is_active', true).order('sort_order', { ascending: true }).then(({ data }) => {
      if (data) setSocials(data)
    })
  }, [])

  return (
    <footer className="bg-surface border-t border-border mt-20 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          {/* Brand + Contact */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div
                className="px-4 py-1.5 rounded-full border"
                style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
              >
                <span className="font-sora font-bold text-2xl tracking-tight" style={{color: 'var(--color-white)'}}>
                  Career <span className="text-green">Radar</span>
                </span>
              </div>
            </Link>
            <p className="text-muted text-sm leading-relaxed mb-6">
              Career Radar is an AI-powered global career ecosystem helping students and early-career professionals discover opportunities, develop in-demand skills, build professional networks, and connect with employers—preparing them for the future of work.
            </p>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-muted">
                <Mail size={14} className="shrink-0" />
                <a href="mailto:hello@careerradar.com" className="hover:text-white transition-colors">hello@careerradar.com</a>
              </p>
              <p className="flex items-center gap-2 text-muted">
                <Handshake size={14} className="shrink-0" />
                <a href="mailto:partnerships@careerradar.com" className="hover:text-white transition-colors">partnerships@careerradar.com</a>
              </p>
              <p className="flex items-center gap-2 text-muted">
                <Globe size={14} className="shrink-0" />
                Global Community | Based in Pakistan
              </p>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-bold text-white mb-6">Explore</h4>
            <ul className="space-y-4">
              <li><Link to="/scholarships" className="text-sm text-muted hover:text-white transition-colors">Scholarships</Link></li>
              <li><Link to="/jobs" className="text-sm text-muted hover:text-white transition-colors">Internships</Link></li>
              <li><Link to="/jobs" className="text-sm text-muted hover:text-white transition-colors">Jobs</Link></li>
              <li><Link to="/education" className="text-sm text-muted hover:text-white transition-colors">AI Resources</Link></li>
              <li><Link to="/dashboard/blueprint" className="text-sm text-muted hover:text-white transition-colors">Career Roadmaps</Link></li>
              <li><Link to="/weekly-content" className="text-sm text-muted hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-bold text-white mb-6">Community</h4>
            <ul className="space-y-4">
              <li><Link to="/social" className="text-sm text-muted hover:text-white transition-colors">WhatsApp Community</Link></li>
              <li><Link to="/community" className="text-sm text-muted hover:text-white transition-colors">Volunteer Program</Link></li>
              <li><Link to="/community" className="text-sm text-muted hover:text-white transition-colors">Events</Link></li>
              <li><Link to="/community" className="text-sm text-muted hover:text-white transition-colors">Success Stories</Link></li>
              <li><Link to="/weekly-content" className="text-sm text-muted hover:text-white transition-colors">Newsletter</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-white mb-6">Company</h4>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-sm text-muted hover:text-white transition-colors">About Career Radar</Link></li>
              <li><Link to="/structure" className="text-sm text-muted hover:text-white transition-colors">Mission & Vision</Link></li>
              <li><Link to="/team" className="text-sm text-muted hover:text-white transition-colors">Our Team</Link></li>
              <li><Link to="/collaborators" className="text-sm text-muted hover:text-white transition-colors">Partners</Link></li>
              <li><Link to="/about" className="text-sm text-muted hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/about" className="text-sm text-muted hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/about" className="text-sm text-muted hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Social + Bottom */}
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
            &copy; {new Date().getFullYear()} Career Radar. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
