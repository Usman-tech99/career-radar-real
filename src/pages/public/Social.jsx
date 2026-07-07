import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { Users, ExternalLink, MessageCircle, Youtube, Instagram, Linkedin, Twitter, Send } from 'lucide-react'
import { Helmet } from 'react-helmet-async'

const platformIcons = {
  whatsapp: MessageCircle,
  youtube: Youtube,
  instagram: Instagram,
  telegram: Send,
  linkedin: Linkedin,
  twitter: Twitter,
  discord: Users,
  tiktok: Users,
  facebook: Users,
  other: Users
}

const platformColors = {
  whatsapp: 'bg-green-500/20 text-green border-green/30',
  youtube: 'bg-red-500/20 text-red-400 border-red-500/30',
  instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  telegram: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  linkedin: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  twitter: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  discord: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  tiktok: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  facebook: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  other: 'bg-white/[0.05] text-muted border-white/10'
}

export default function Social({ navless } = {}) {
  const [socials, setSocials] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSocials()
  }, [])

  async function fetchSocials() {
    const { data, error } = await supabase
      .from('socials')
      .select('*')
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('sort_order', { ascending: true })

    if (!error && data) setSocials(data)
    setLoading(false)
  }

  const primarySocial = socials.find(s => s.is_primary)
  const otherSocials = socials.filter(s => !s.is_primary)

  return (
    <div className="min-h-screen bg-[#07070C] flex flex-col">
      <Helmet>
        <title>Social — Career Radar</title>
        <meta name="description" content="Follow Career Radar on social media and join our WhatsApp, Telegram, Discord, and YouTube communities." />
        <meta property="og:title" content="Social — Career Radar" />
        <meta property="og:description" content="Follow Career Radar on social media and join our WhatsApp, Telegram, Discord, and YouTube communities." />
        <meta property="og:type" content="website" />
        <meta name="keywords" content="career radar social, whatsapp, telegram, discord, youtube community" />
      </Helmet>
      {!navless && <Navbar />}
      
      <main className="flex-1 pt-32 pb-20 px-4 max-w-7xl w-full mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold font-sora mb-4">Join Our <span className="text-purple-accent">Community</span></h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">Connect with us across all platforms. Stay updated with the latest opportunities and resources.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="skeleton h-64 rounded-2xl w-full" />)}
          </div>
        ) : socials.length === 0 ? (
          <div className="glass-card text-center py-20 text-muted">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>Social links will be displayed here.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Primary Social */}
            {primarySocial && (
              <a 
                href={primarySocial.url} 
                target="_blank" 
                rel="noreferrer"
                className="block glass-card p-8 md:p-12 border-2 border-purple-accent/30 hover:border-purple-accent transition-colors relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-accent/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className={`w-24 h-24 rounded-2xl flex items-center justify-center ${platformColors[primarySocial.platform_type] || platformColors.other}`}>
                    {(() => {
                      const Icon = platformIcons[primarySocial.platform_type] || Users
                      return <Icon size={48} />
                    })()}
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <span className="inline-block px-3 py-1 rounded-full bg-purple-accent/20 text-purple-accent text-xs font-bold uppercase tracking-wider mb-3">
                      Primary Community
                    </span>
                    <h2 className="text-3xl font-bold text-white mb-2">{primarySocial.platform_name}</h2>
                    {primarySocial.description && (
                      <p className="text-muted text-lg mb-4">{primarySocial.description}</p>
                    )}
                    {primarySocial.members_count && (
                      <div className="flex items-center gap-2 text-green">
                        <Users size={18} />
                        <span className="font-medium">{primarySocial.members_count} members</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-purple-accent text-[#07070C] group-hover:scale-110 transition-transform">
                    <ExternalLink size={24} />
                  </div>
                </div>
              </a>
            )}

            {/* Other Socials */}
            {otherSocials.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherSocials.map(social => (
                  <a 
                    key={social.id} 
                    href={social.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className={`glass-card p-6 hover:-translate-y-1 transition-transform border ${platformColors[social.platform_type] || platformColors.other}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${platformColors[social.platform_type] || platformColors.other}`}>
                        {(() => {
                          const Icon = platformIcons[social.platform_type] || Users
                          return <Icon size={24} />
                        })()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{social.platform_name}</h3>
                        {social.description && (
                          <p className="text-sm text-muted mb-3 line-clamp-2">{social.description}</p>
                        )}
                        {social.members_count && (
                          <div className="flex items-center gap-2 text-xs text-muted">
                            <Users size={12} />
                            <span>{social.members_count}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      {!navless && <Footer />}
    </div>
  )
}
