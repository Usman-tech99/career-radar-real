import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import SafeImage from '../../components/ui/SafeImage'
import { MagicCard } from '../../components/ui/magic-card'
import { Users, Linkedin, Github, Youtube, Twitter, Instagram, Globe, X, ExternalLink, MapPin, GraduationCap, Target, Sparkles, Crown, Star } from 'lucide-react'
import { Helmet } from 'react-helmet-async'

const platformIcons = {
  linkedin: Linkedin, github: Github, youtube: Youtube,
  twitter: Twitter, instagram: Instagram, website: Globe,
  facebook: Users, discord: Users, other: ExternalLink,
}

const platformColors = {
  linkedin: 'text-blue-500 hover:text-blue-400',
  github: 'text-gray-300 hover:text-white',
  youtube: 'text-red-500 hover:text-red-400',
  twitter: 'text-sky-400 hover:text-sky-300',
  instagram: 'text-pink-400 hover:text-pink-300',
  website: 'text-gold hover:text-gold/80',
  facebook: 'text-blue-500 hover:text-blue-400',
  discord: 'text-indigo-400 hover:text-indigo-300',
  other: 'text-muted hover:text-white',
}

const founderRoles = ['Founder', 'Co-Founder', 'CEO', 'CTO']

function isFounder(role) {
  return founderRoles.some(r => role?.toLowerCase().includes(r.toLowerCase()))
}

export default function Team({ navless } = {}) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetchTeam() }, [])

  async function fetchTeam() {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    if (!error && data) {
      const sorted = [...data].sort((a, b) => {
        const aFounder = isFounder(a.role) ? 0 : 1
        const bFounder = isFounder(b.role) ? 0 : 1
        if (aFounder !== bFounder) return aFounder - bFounder
        return (a.sort_order || 99) - (b.sort_order || 99)
      })
      setMembers(sorted)
    }
    setLoading(false)
  }

  const founders = members.filter(m => isFounder(m.role))
  const rest = members.filter(m => !isFounder(m.role))

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Helmet>
        <title>Our Team — Career Radar</title>
        <meta name="description" content="Meet the passionate team behind Career Radar building the future of career development with AI-powered tools and global opportunities." />
        <meta property="og:title" content="Our Team — Career Radar" />
        <meta property="og:description" content="Meet the passionate team behind Career Radar building the future of career development with AI-powered tools and global opportunities." />
        <meta property="og:type" content="website" />
        <meta name="keywords" content="career radar team, founders, developers, career development" />
      </Helmet>
      {!navless && <Navbar />}
      
      <main className="flex-1 pt-32 pb-20 px-4 max-w-7xl w-full mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold font-sora mb-4">Our <span className="text-gold">Team</span></h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">Meet the passionate people building Career Radar.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="skeleton h-80 rounded-2xl w-full" />)}
          </div>
        ) : members.length === 0 ? (
          <div className="glass-card text-center py-20 text-muted">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>Team members will be displayed here.</p>
          </div>
        ) : (
          <>
            {/* Founders Section */}
            {founders.length > 0 && (
              <div className="mb-16">
                <div className="flex items-center justify-center gap-3 mb-10">
                  <Crown size={24} className="text-gold" />
                  <h2 className="text-2xl font-bold font-sora text-white">Leadership</h2>
                  <Star size={20} className="text-gold" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                  {founders.map(member => (
                    <MagicCard
                      key={member.id}
                      gradientColor="rgba(245,166,35,0.15)"
                      gradientFrom="rgba(245,166,35,0.4)"
                      gradientTo="rgba(245,158,11,0.2)"
                      gradientSize={300}
                    >
                      <button
                        onClick={() => setSelected(member)}
                        className="w-full flex flex-col items-center text-center p-8 cursor-pointer"
                      >
                        <div className="relative mb-6">
                          <div className="absolute -inset-2 bg-gold/20 rounded-full blur-xl" />
                          <div className="absolute -inset-1 rounded-full border border-gold/30" />
                          <SafeImage src={member.image_url} alt={member.name} className="relative w-32 h-32 rounded-full object-cover border-2 border-gold/30" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                        <p className="text-gold font-semibold mb-4 flex items-center gap-1.5">
                          <Crown size={14} /> {member.role}
                        </p>
                        {member.skills?.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-2 mb-4">
                            {member.skills.slice(0, 4).map((skill, i) => (
                              <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-gold/10 text-gold/80 border border-gold/15">{skill}</span>
                            ))}
                          </div>
                        )}
                        {member.goal && (
                          <p className="text-sm text-muted mb-6 line-clamp-2 italic">"{member.goal}"</p>
                        )}
                        <div className="flex gap-3 mt-auto">
                          {member.social_links && typeof member.social_links === 'object' && Object.entries(member.social_links).map(([p, url]) => {
                            const Icon = platformIcons[p] || ExternalLink
                            return (
                              <a key={p} href={url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                                className={`${platformColors[p] || 'text-muted hover:text-white'} transition-colors`}>
                                <Icon size={18} />
                              </a>
                            )
                          })}
                        </div>
                      </button>
                    </MagicCard>
                  ))}
                </div>
              </div>
            )}

            {/* Rest of Team */}
            {rest.length > 0 && (
              <div>
                {founders.length > 0 && (
                  <h2 className="text-2xl font-bold font-sora text-white text-center mb-10">Team</h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {rest.map(member => (
                    <MagicCard key={member.id} gradientSize={200} gradientColor="rgba(245,166,35,0.08)">
                      <button
                        onClick={() => setSelected(member)}
                        className="w-full flex flex-col items-center text-center p-8 cursor-pointer"
                      >
                        <div className="relative mb-6">
                          <SafeImage src={member.image_url} alt={member.name} className="w-32 h-32 rounded-full object-cover border-4 border-white/[0.05]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                        <p className="text-gold font-medium mb-4">{member.role}</p>
                        {member.skills?.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-2 mb-4">
                            {member.skills.slice(0, 4).map((skill, i) => (
                              <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.05] text-muted border border-white/[0.06]">{skill}</span>
                            ))}
                          </div>
                        )}
                        {member.goal && (
                          <p className="text-sm text-muted mb-6 line-clamp-2 italic">"{member.goal}"</p>
                        )}
                        <div className="flex gap-3 mt-auto">
                          {member.social_links && typeof member.social_links === 'object' && Object.entries(member.social_links).map(([p, url]) => {
                            const Icon = platformIcons[p] || ExternalLink
                            return (
                              <a key={p} href={url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                                className={`${platformColors[p] || 'text-muted hover:text-white'} transition-colors`}>
                                <Icon size={18} />
                              </a>
                            )
                          })}
                        </div>
                      </button>
                    </MagicCard>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button onClick={() => setSelected(null)} className="text-muted hover:text-white p-1"><X size={24} /></button>
            </div>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-4">
                {isFounder(selected.role) && <div className="absolute -inset-2 bg-gold/20 rounded-full blur-xl" />}
                <SafeImage src={selected.image_url} alt={selected.name} className={`w-28 h-28 rounded-full object-cover border-4 ${isFounder(selected.role) ? 'border-gold/30' : 'border-white/[0.05]'}`} />
              </div>
              <h2 className="text-2xl font-bold text-white">{selected.name}</h2>
              <p className={`font-medium flex items-center gap-1.5 ${isFounder(selected.role) ? 'text-gold' : 'text-gold'}`}>
                {isFounder(selected.role) && <Crown size={14} />} {selected.role}
              </p>
            </div>
            <div className="space-y-4">
              {selected.age && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <MapPin size={18} className="text-muted" />
                  <span className="text-sm text-white">{selected.age} years old</span>
                </div>
              )}
              {selected.education && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <GraduationCap size={18} className="text-blue-accent" />
                  <span className="text-sm text-white">{selected.education}</span>
                </div>
              )}
              {selected.goal && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <Target size={18} className="text-gold mt-0.5" />
                  <span className="text-sm text-muted">{selected.goal}</span>
                </div>
              )}
              {selected.skills?.length > 0 && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-yellow-400" />
                    <span className="text-sm font-semibold text-white">Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.skills.map((skill, i) => (
                      <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-white/[0.05] text-muted border border-white/[0.06]">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
              {selected.social_links && typeof selected.social_links === 'object' && Object.keys(selected.social_links).length > 0 && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <span className="text-sm font-semibold text-white block mb-3">Connect</span>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(selected.social_links).map(([p, url]) => {
                      const Icon = platformIcons[p] || ExternalLink
                      return (
                        <a key={p} href={url} target="_blank" rel="noreferrer"
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition-colors ${platformColors[p] || 'text-muted hover:text-white'}`}>
                          <Icon size={16} />
                          <span className="text-xs capitalize">{p}</span>
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!navless && <Footer />}
    </div>
  )
}