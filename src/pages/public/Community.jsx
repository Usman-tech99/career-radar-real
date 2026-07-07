import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { Link } from 'react-router-dom'
import { Users, MessageCircle, ChevronRight, Calendar, Quote, Heart } from 'lucide-react'
import { ShimmerButton } from '../../components/magicui/shimmer-button'
import { Helmet } from 'react-helmet-async'

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

  const communityLinks = data?.community_links || []
  const events = data?.events?.length ? data.events : [
    { title: 'Community Orientation', date: 'Monthly', description: 'Welcome session for new members to learn about Career Radar.', type: 'upcoming', link: '/social' },
    { title: 'Career Workshop', date: 'Bi-weekly', description: 'Interactive sessions on scholarships, internships, and skill building.', type: 'upcoming', link: '/social' },
  ]
  const volunteerProgram = data?.volunteer_program?.text
    ? data.volunteer_program
    : { heading: 'Volunteer Program', text: 'Join our volunteer team and help fellow students discover opportunities, build skills, and grow their careers. Volunteers gain leadership experience, networking opportunities, and recognition in the community.', image_url: '' }
  const successStories = data?.success_stories || []

  return (
    <div className="min-h-screen bg-[#07070C] flex flex-col">
      <Helmet>
        <title>Community — Career Radar</title>
        <meta name="description" content="Join the Career Radar global community. Connect with mentors, peers, and professionals across multiple countries." />
        <meta property="og:title" content="Community — Career Radar" />
        <meta property="og:description" content="Join the Career Radar global community. Connect with mentors, peers, and professionals across multiple countries." />
        <meta property="og:type" content="website" />
        <meta name="keywords" content="career community, mentors, networking, career radar community" />
      </Helmet>
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

        {/* WhatsApp Groups */}
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

        {/* Events */}
        {events.length > 0 && (
          <section className="max-w-4xl mx-auto px-4 pb-20">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="flex items-center justify-center gap-3 mb-2">
                <Calendar size={24} className="text-green" />
                <h2 className="text-3xl font-bold font-sora text-white">Events</h2>
              </div>
              <p className="text-muted text-center max-w-2xl mx-auto mb-10">Workshops, webinars, and meetups for our community.</p>
              <div className="space-y-4">
                {events
                  .filter(e => e.type === 'upcoming')
                  .concat(events.filter(e => e.type !== 'upcoming'))
                  .map((event, i) => (
                    <div key={i} className={`glass-card p-5 flex items-start gap-4 ${event.type === 'upcoming' ? 'border-l-4 border-green' : 'opacity-60'}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-white">{event.title}</h3>
                          {event.type === 'upcoming' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green/20 text-green font-medium">Upcoming</span>}
                        </div>
                        {event.date && <p className="text-xs text-muted mt-1">{event.date}</p>}
                        {event.description && <p className="text-sm text-muted mt-2">{event.description}</p>}
                      </div>
                      {event.link && (
                        <a href={event.link} target="_blank" rel="noreferrer" className="btn-primary text-sm px-4 py-2 shrink-0">
                          {event.type === 'upcoming' ? 'Register' : 'View'}
                        </a>
                      )}
                    </div>
                  ))}
              </div>
            </motion.div>
          </section>
        )}

        {/* Volunteer Program */}
        {volunteerProgram?.text && (
          <section className="max-w-4xl mx-auto px-4 pb-20">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <Heart size={22} className="text-green" />
                  <h2 className="text-2xl font-bold font-sora text-white">{volunteerProgram.heading}</h2>
                </div>
                <p className="text-muted leading-relaxed">{volunteerProgram.text}</p>
              </div>
              {volunteerProgram.image_url && (
                <img src={volunteerProgram.image_url} alt="Volunteer" className="w-full md:w-48 h-48 rounded-xl object-cover shrink-0" />
              )}
            </motion.div>
          </section>
        )}

        {/* Success Stories */}
        {successStories.length > 0 && (
          <section className="max-w-4xl mx-auto px-4 pb-20">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl font-bold font-sora text-white mb-4 text-center">Success Stories</h2>
              <p className="text-muted text-center max-w-2xl mx-auto mb-10">Real achievements from our community members.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {successStories.map((story, i) => (
                  <div key={i} className="glass-card p-6">
                    <Quote size={20} className="text-green/40 mb-3" />
                    <p className="text-muted text-sm leading-relaxed mb-4">&ldquo;{story.quote}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      {story.image_url ? (
                        <img src={story.image_url} alt={story.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green/20 flex items-center justify-center text-green font-bold text-sm">{story.name.charAt(0)}</div>
                      )}
                      <div>
                        <p className="text-white font-semibold text-sm">{story.name}</p>
                        <p className="text-green text-xs">{story.achievement}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
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
      </main>

      {!navless && <Footer />}
    </div>
  )
}
