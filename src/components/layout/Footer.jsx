import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <span className="font-sora font-bold text-2xl tracking-tight text-white">
                Career <span className="text-green">Radar</span>
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
              <li><Link to="/education" className="text-sm text-muted hover:text-white transition-colors">Education & Courses</Link></li>
              <li><Link to="/shop" className="text-sm text-muted hover:text-white transition-colors">Premium Shop</Link></li>
            </ul>
          </div>

          {/* About Links */}
          <div>
            <h4 className="font-bold text-white mb-6">Company</h4>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-sm text-muted hover:text-white transition-colors">Our Story</Link></li>
              <li><Link to="/structure" className="text-sm text-muted hover:text-white transition-colors">Aim & Vision</Link></li>
              <li><Link to="/team" className="text-sm text-muted hover:text-white transition-colors">The Team</Link></li>
              <li><Link to="/collaborators" className="text-sm text-muted hover:text-white transition-colors">Partners</Link></li>
            </ul>
          </div>
        </div>

        {/* Social Links Row */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 flex-wrap">
            {socials.map(social => (
              <a 
                key={social.id} 
                href={social.url} 
                target="_blank" 
                rel="noreferrer"
                className="text-muted hover:text-white transition-colors text-sm font-medium px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05]"
              >
                {social.platform_name}
              </a>
            ))}
          </div>
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} Career Radar. Founded {about?.founded_date || '2024'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
