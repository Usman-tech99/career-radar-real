import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import SafeImage from '../../components/ui/SafeImage'
import { Users, Linkedin, Github, Youtube, Twitter, Instagram, Globe, X, ExternalLink, MapPin, GraduationCap, Target, Sparkles } from 'lucide-react'

const platformIcons = {
  linkedin: Linkedin,
  github: Github,
  youtube: Youtube,
  twitter: Twitter,
  instagram: Instagram,
  website: Globe,
  facebook: Users,
  discord: Users,
  other: ExternalLink,
}

const platformColors = {
  linkedin: 'text-blue-500 hover:text-blue-400',
  github: 'text-gray-300 hover:text-white',
  youtube: 'text-red-500 hover:text-red-400',
  twitter: 'text-sky-400 hover:text-sky-300',
  instagram: 'text-pink-400 hover:text-pink-300',
  website: 'text-green hover:text-green/80',
  facebook: 'text-blue-500 hover:text-blue-400',
  discord: 'text-indigo-400 hover:text-indigo-300',
  other: 'text-muted hover:text-white',
}

export default function Team() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchTeam()
  }, [])

  async function fetchTeam() {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (!error && data) setMembers(data)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#07070C] flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20 px-4 max-w-7xl w-full mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold font-sora mb-4">Our <span className="text-green">Team</span></h1>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {members.map(member => (
              <button
                key={member.id}
                onClick={() => setSelected(member)}
                className="glass-card flex flex-col items-center text-center p-8 hover:-translate-y-1 transition-transform cursor-pointer text-left"
              >
                <div className="relative mb-6">
                  <SafeImage src={member.image_url} alt={member.name} className="w-32 h-32 rounded-full object-cover border-4 border-white/[0.05]" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                <p className="text-green font-medium mb-4">{member.role}</p>
                
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
                  {member.social_links && typeof member.social_links === 'object' && Object.entries(member.social_links).map(([platform, url]) => {
                    const Icon = platformIcons[platform] || ExternalLink
                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className={`${platformColors[platform] || 'text-muted hover:text-white'} transition-colors`}
                      >
                        <Icon size={18} />
                      </a>
                    )
                  })}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button onClick={() => setSelected(null)} className="text-muted hover:text-white p-1">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex flex-col items-center text-center mb-6">
              <SafeImage src={selected.image_url} alt={selected.name} className="w-28 h-28 rounded-full object-cover border-4 border-white/[0.05] mb-4" />
              <h2 className="text-2xl font-bold text-white">{selected.name}</h2>
              <p className="text-green font-medium">{selected.role}</p>
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
                  <Target size={18} className="text-green mt-0.5" />
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
                    {Object.entries(selected.social_links).map(([platform, url]) => {
                      const Icon = platformIcons[platform] || ExternalLink
                      return (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition-colors ${platformColors[platform] || 'text-muted hover:text-white'}`}
                        >
                          <Icon size={16} />
                          <span className="text-xs capitalize">{platform}</span>
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

      <Footer />
    </div>
  )
}