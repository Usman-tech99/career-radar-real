import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { Users, Linkedin, Twitter, Crown } from 'lucide-react'

export default function Team() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeam()
  }, [])

  async function fetchTeam() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_visible_on_team_page', true)
      .order('display_order', { ascending: true })

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
            {[1,2,3].map(i => <div key={i} className="skeleton h-64 rounded-2xl w-full" />)}
          </div>
        ) : members.length === 0 ? (
          <div className="glass-card text-center py-20 text-muted">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>Team members will be displayed here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {members.map(member => (
              <div 
                key={member.id} 
                className="glass-card flex flex-col items-center text-center p-8 hover:-translate-y-1 transition-transform"
              >
                <div className="relative mb-6">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.full_name} className="w-32 h-32 rounded-full object-cover border-4 border-white/[0.05]" />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green/20 to-blue-accent/20 flex items-center justify-center border-4 border-white/[0.05]">
                      <span className="text-4xl font-bold text-white">{member.full_name?.[0] || '?'}</span>
                    </div>
                  )}
                  {member.is_founder && (
                    <div className="absolute -top-2 -right-2 bg-gold text-[#07070C] p-2 rounded-full">
                      <Crown size={16} />
                    </div>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-1">{member.full_name}</h3>
                {member.role_title && (
                  <p className="text-green font-medium mb-4">{member.role_title}</p>
                )}
                
                {member.bio && (
                  <p className="text-sm text-muted mb-6 line-clamp-3">{member.bio}</p>
                )}
                
                <div className="flex gap-4 mt-auto">
                  {member.linkedin_url && (
                    <a href={member.linkedin_url} target="_blank" rel="noreferrer" className="text-muted hover:text-blue-400 transition-colors">
                      <Linkedin size={20} />
                    </a>
                  )}
                  {member.twitter_url && (
                    <a href={member.twitter_url} target="_blank" rel="noreferrer" className="text-muted hover:text-blue-300 transition-colors">
                      <Twitter size={20} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
