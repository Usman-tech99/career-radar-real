import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import SafeImage from '../../components/ui/SafeImage'
import { Handshake, ExternalLink, Youtube, MessageCircle, Instagram, Globe } from 'lucide-react'

const collaborationTypeColors = {
  Partner: 'badge-blue',
  Sponsor: 'badge-gold',
  Affiliate: 'badge-green',
  Friend: 'badge-purple'
}

export default function Collaborators({ navless } = {}) {
  const [collaborators, setCollaborators] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCollaborators()
  }, [])

  async function fetchCollaborators() {
    const { data, error } = await supabase
      .from('collaborators')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })

    if (!error && data) setCollaborators(data)
    setLoading(false)
  }

  const featuredCollaborator = collaborators.find(c => c.is_featured)
  const otherCollaborators = collaborators.filter(c => !c.is_featured)

  return (
    <div className="min-h-screen bg-[#07070C] flex flex-col">
      {!navless && <Navbar />}
      
      <main className="flex-1 pt-32 pb-20 px-4 max-w-7xl w-full mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold font-sora mb-4">Our <span className="text-blue-accent">Collaborators</span></h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">We partner with amazing organizations and individuals to bring you the best opportunities.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="skeleton h-80 rounded-2xl w-full" />)}
          </div>
        ) : collaborators.length === 0 ? (
          <div className="glass-card text-center py-20 text-muted">
            <Handshake size={48} className="mx-auto mb-4 opacity-50" />
            <p>Collaborators will be displayed here.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Featured Collaborator */}
            {featuredCollaborator && (
              <div className="glass-card p-8 md:p-12 border-2 border-blue-accent/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-accent/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <SafeImage src={featuredCollaborator.logo_url} alt={featuredCollaborator.name} className="w-32 h-32 rounded-2xl object-cover border-4 border-blue-accent/20" />
                  <div className="flex-1 text-center md:text-left">
                    <span className="inline-block px-3 py-1 rounded-full bg-blue-accent/20 text-blue-accent text-xs font-bold uppercase tracking-wider mb-3">
                      Featured Partner
                    </span>
                    <h2 className="text-3xl font-bold text-white mb-2">{featuredCollaborator.name}</h2>
                    {featuredCollaborator.description && (
                      <p className="text-muted text-lg mb-4">{featuredCollaborator.description}</p>
                    )}
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${collaborationTypeColors[featuredCollaborator.collaboration_type] || 'badge-blue'}`}>
                      {featuredCollaborator.collaboration_type}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    {featuredCollaborator.website_url && (
                      <a href={featuredCollaborator.website_url} target="_blank" rel="noreferrer" className="flex items-center justify-center w-12 h-12 rounded-full bg-white/[0.05] hover:bg-blue-accent hover:text-[#07070C] transition-colors">
                        <Globe size={20} />
                      </a>
                    )}
                    {featuredCollaborator.youtube_url && (
                      <a href={featuredCollaborator.youtube_url} target="_blank" rel="noreferrer" className="flex items-center justify-center w-12 h-12 rounded-full bg-white/[0.05] hover:bg-red-500 hover:text-white transition-colors">
                        <Youtube size={20} />
                      </a>
                    )}
                    {featuredCollaborator.whatsapp_url && (
                      <a href={`https://wa.me/${featuredCollaborator.whatsapp_url.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center w-12 h-12 rounded-full bg-white/[0.05] hover:bg-green hover:text-[#07070C] transition-colors">
                        <MessageCircle size={20} />
                      </a>
                    )}
                    {featuredCollaborator.instagram_url && (
                      <a href={featuredCollaborator.instagram_url} target="_blank" rel="noreferrer" className="flex items-center justify-center w-12 h-12 rounded-full bg-white/[0.05] hover:bg-pink-500 hover:text-white transition-colors">
                        <Instagram size={20} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Other Collaborators */}
            {otherCollaborators.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {otherCollaborators.map(collab => (
                  <div 
                    key={collab.id} 
                    className="glass-card p-6 hover:-translate-y-1 transition-transform"
                  >
                    <div className="flex flex-col items-center text-center mb-6">
                      <SafeImage src={collab.logo_url} alt={collab.name} className="w-20 h-20 rounded-xl object-cover border-2 border-white/[0.05] mb-4" />
                      <h3 className="text-xl font-bold text-white mb-1">{collab.name}</h3>
                      {collab.description && (
                        <p className="text-sm text-muted line-clamp-2">{collab.description}</p>
                      )}
                    </div>
                    
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${collaborationTypeColors[collab.collaboration_type] || 'badge-blue'}`}>
                      {collab.collaboration_type}
                    </span>
                    
                    <div className="flex gap-3 justify-center mt-auto">
                      {collab.website_url && (
                        <a href={collab.website_url} target="_blank" rel="noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.05] hover:bg-blue-accent hover:text-[#07070C] transition-colors">
                          <Globe size={18} />
                        </a>
                      )}
                      {collab.youtube_url && (
                        <a href={collab.youtube_url} target="_blank" rel="noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.05] hover:bg-red-500 hover:text-white transition-colors">
                          <Youtube size={18} />
                        </a>
                      )}
                      {collab.whatsapp_url && (
                        <a href={`https://wa.me/${collab.whatsapp_url.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.05] hover:bg-green hover:text-[#07070C] transition-colors">
                          <MessageCircle size={18} />
                        </a>
                      )}
                      {collab.instagram_url && (
                        <a href={collab.instagram_url} target="_blank" rel="noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.05] hover:bg-pink-500 hover:text-white transition-colors">
                          <Instagram size={18} />
                        </a>
                      )}
                    </div>
                  </div>
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
