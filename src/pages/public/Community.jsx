import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { Link } from 'react-router-dom'
import { Users, MessageCircle, BookOpen, Briefcase, GraduationCap, Target, ChevronRight } from 'lucide-react'
import { ShimmerButton } from '../../components/magicui/shimmer-button'

const statIcons = {
  community_members: Users,
  countries: GlobeIcon,
  whatsapp_groups: MessageCircle,
  career_followers: Users,
  scholarship_followers: GraduationCap,
  ai_followers: BookOpen,
}

function GlobeIcon({ size }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
}

export default function Community({ navless } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCommunity()
  }, [])

  async function fetchCommunity() {
    const { data: pageData } = await supabase.from('community_page').select('*').eq('id', 1).single()
    if (pageData) setData(pageData)
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#07070C] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const stats = data?.stats || []
  const roadmap = data?.roadmap_items || []
  const exploreLinks = data?.explore_links || []
  const communityLinks = data?.community_links || []

  return (
    <div className="min-h-screen bg-[#07070C] flex flex-col">
      {!navless && <Navbar />}

      <main className="flex-1">
        {/* Hero */}
        <section className="pt-36 pb-20 px-4 text-center relative overflow-hidden">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green/10 border border-green/20 text-green text-sm font-medium mb-6">
              <Users size={14} /> 1,350+ Community Members
            </div>
            <h1 className="text-5xl md:text-6xl font-bold font-sora text-white mb-6 leading-tight">
              Your Career <span className="text-green">Community</span> Awaits
            </h1>
            <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10">
              Join thousands of students and professionals discovering opportunities, building skills, and growing together across 12+ countries.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <ShimmerButton as={Link} to={data?.primary_cta_link || '/social'} shimmerColor="#10B981" background="#10B981" borderRadius="14px" className="text-lg px-8 py-4 font-semibold w-full sm:w-auto">
                {data?.primary_cta_text || 'Join Community'} <ChevronRight size={20} />
              </ShimmerButton>
              <Link to={data?.secondary_cta_link || '/collaborators'} className="btn-ghost w-full sm:w-auto text-lg px-8 py-4 border border-white/10 hover:border-white/20">
                {data?.secondary_cta_text || 'Partner With Us'}
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Stats */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.map((stat, i) => {
              const Icon = statIcons[stat.key] || Users
              return (
                <motion.div key={stat.key || i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="glass-card p-4 text-center">
                  <Icon className="text-green mx-auto mb-2" size={24} />
                  <div className="text-2xl font-black text-white">{stat.value}+</div>
                  <div className="text-xs text-muted mt-1">{stat.label}</div>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Roadmap */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold font-sora text-white mb-4 text-center">Building the Future of Career Development</h2>
            <p className="text-muted text-center max-w-2xl mx-auto mb-12">Today we deliver verified opportunities, career resources, community support, and AI learning. Coming soon: even more powerful tools.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold text-green mb-4 flex items-center gap-2"><Target size={18} /> Today</h3>
                <ul className="space-y-3">
                  {roadmap.filter(r => r.status === 'live').map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted">
                      <span className="text-green mt-0.5 shrink-0">&#10003;</span>
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-accent mb-4 flex items-center gap-2"><GraduationCap size={18} /> Coming Soon</h3>
                <ul className="space-y-3">
                  {roadmap.filter(r => r.status === 'coming').map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted">
                      <span className="w-5 h-5 rounded-full border border-blue-accent/40 text-blue-accent flex items-center justify-center text-[10px] shrink-0 mt-0.5">&#8226;</span>
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Founder Message */}
        {data?.founder_message && (
          <section className="max-w-4xl mx-auto px-4 pb-20">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-8 md:p-12 border-l-4 border-green">
              <h2 className="text-2xl font-bold font-sora text-white mb-6">A Message from the Founder</h2>
              <p className="text-muted leading-relaxed whitespace-pre-line">{data.founder_message}</p>
            </motion.div>
          </section>
        )}

        {/* Testimonials */}
        <section className="max-w-4xl mx-auto px-4 pb-20 text-center">
          <h2 className="text-3xl font-bold font-sora text-white mb-4">{data?.testimonials_heading || 'Testimonials'}</h2>
          <p className="text-muted max-w-2xl mx-auto leading-relaxed">{data?.testimonials_text}</p>
        </section>

        {/* Community Links */}
        {communityLinks.length > 0 && (
          <section className="max-w-4xl mx-auto px-4 pb-20">
            <h2 className="text-2xl font-bold font-sora text-white mb-8 text-center">Join Our WhatsApp Communities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {communityLinks.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noreferrer" className="glass-card p-5 flex items-center gap-4 hover:-translate-y-1 transition-transform">
                  <div className="w-12 h-12 rounded-full bg-green/20 flex items-center justify-center shrink-0">
                    <MessageCircle size={24} className="text-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white">{link.name}</h3>
                    {link.members && <p className="text-xs text-muted">{link.members} members</p>}
                  </div>
                  <ChevronRight size={18} className="text-muted shrink-0" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-4 pb-20 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-10 md:p-14">
            <h2 className="text-3xl md:text-4xl font-bold font-sora text-white mb-4">{data?.cta_heading || 'Start Your Career Journey Today'}</h2>
            <p className="text-muted max-w-2xl mx-auto mb-8">{data?.cta_text}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <ShimmerButton as={Link} to={data?.primary_cta_link || '/social'} shimmerColor="#10B981" background="#10B981" borderRadius="14px" className="text-lg px-8 py-4 font-semibold w-full sm:w-auto">
                {data?.primary_cta_text || 'Join Community'} <ChevronRight size={20} />
              </ShimmerButton>
              <Link to={data?.secondary_cta_link || '/collaborators'} className="btn-ghost w-full sm:w-auto text-lg px-8 py-4 border border-white/10 hover:border-white/20">
                {data?.secondary_cta_text || 'Partner With Us'}
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Explore Footer */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {exploreLinks.map((link, i) => {
              const Icon = link.icon === 'GraduationCap' ? GraduationCap : link.icon === 'Briefcase' ? Briefcase : link.icon === 'BookOpen' ? BookOpen : link.icon === 'Users' ? Users : link.icon === 'MessageCircle' ? MessageCircle : BookOpen
              return (
                <Link key={i} to={link.url} className="glass-card p-5 text-center hover:-translate-y-1 transition-transform">
                  <Icon className="text-green mx-auto mb-2" size={22} />
                  <h3 className="text-sm font-semibold text-white">{link.label}</h3>
                </Link>
              )
            })}
          </div>
        </section>
      </main>

      {!navless && <Footer />}
    </div>
  )
}
