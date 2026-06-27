import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import SafeImage from '../../components/ui/SafeImage'
import { Mail, MessageCircle, Crown, Calendar } from 'lucide-react'

export default function About() {
  const [data, setData] = useState(null)
  const [founders, setFounders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAboutData()
  }, [])

  async function fetchAboutData() {
    const [pageRes, profilesRes] = await Promise.all([
      supabase.from('about_page').select('*').eq('id', 1).single(),
      supabase.from('profiles').select('*').eq('is_founder', true).order('display_order', { ascending: true })
    ])

    if (!pageRes.error) setData(pageRes.data)
    if (!profilesRes.error) setFounders(profilesRes.data || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#07070C] flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20 px-4 max-w-7xl w-full mx-auto">
        {loading ? (
          <div className="skeleton w-full h-96 rounded-2xl"></div>
        ) : (
          <div className="space-y-16">
            {/* Hero Section */}
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold font-sora mb-4">{data?.story_heading || 'Our Story'}</h1>
              {data?.tagline && (
                <p className="text-xl text-muted max-w-2xl mx-auto">{data.tagline}</p>
              )}
            </div>

            {/* Story Section */}
            {data?.story_text && (
              <section className="glass-card p-8 md:p-12">
                <div className="prose prose-invert max-w-none">
                  <p className="text-lg text-white leading-relaxed whitespace-pre-line">{data.story_text}</p>
                </div>
              </section>
            )}

            {/* Founders Section */}
            {founders.length > 0 && (
              <section>
                <h2 className="text-3xl font-bold text-center mb-8">Meet the Founders</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {founders.map(founder => (
                    <div 
                      key={founder.id} 
                      className="glass-card flex flex-col items-center text-center p-8 hover:-translate-y-1 transition-transform border border-gold/20"
                    >
                      <div className="relative mb-6">
                        <SafeImage src={founder.avatar_url} alt={founder.full_name} className="w-32 h-32 rounded-full object-cover border-4 border-gold/30" />
                        <div className="absolute -top-2 -right-2 bg-gold text-[#07070C] p-2 rounded-full">
                          <Crown size={16} />
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-1">{founder.full_name}</h3>
                      {founder.role_title && (
                        <p className="text-gold font-medium mb-4">{founder.role_title}</p>
                      )}
                      
                      {founder.bio && (
                        <p className="text-sm text-muted mb-6 line-clamp-3">{founder.bio}</p>
                      )}
                      
                      <div className="flex gap-4 mt-auto">
                        {founder.linkedin_url && (
                          <a href={founder.linkedin_url} target="_blank" rel="noreferrer" className="text-muted hover:text-blue-400 transition-colors">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                          </a>
                        )}
                        {founder.twitter_url && (
                          <a href={founder.twitter_url} target="_blank" rel="noreferrer" className="text-muted hover:text-blue-300 transition-colors">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Contact Section */}
            <section className="glass-card p-8 md:p-12">
              <h2 className="text-3xl font-bold text-center mb-8">Get in Touch</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {data?.contact_email && (
                  <a href={`mailto:${data.contact_email}`} className="flex flex-col items-center p-6 bg-white/[0.02] border border-border rounded-xl hover:border-green transition-colors">
                    <Mail className="text-green mb-3" size={32} />
                    <span className="text-sm text-muted mb-1">Email</span>
                    <span className="font-medium">{data.contact_email}</span>
                  </a>
                )}
                {data?.contact_whatsapp && (
                  <a href={`https://wa.me/${data.contact_whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex flex-col items-center p-6 bg-white/[0.02] border border-border rounded-xl hover:border-green transition-colors">
                    <MessageCircle className="text-green mb-3" size={32} />
                    <span className="text-sm text-muted mb-1">WhatsApp</span>
                    <span className="font-medium">{data.contact_whatsapp}</span>
                  </a>
                )}
                {data?.community_link && (
                  <a href={data.community_link} target="_blank" rel="noreferrer" className="flex flex-col items-center p-6 bg-white/[0.02] border border-border rounded-xl hover:border-green transition-colors">
                    <svg className="text-green mb-3" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                    <span className="text-sm text-muted mb-1">Community</span>
                    <span className="font-medium">Join Discord</span>
                  </a>
                )}
              </div>

              {data?.founded_date && (
                <div className="text-center mt-8 pt-8 border-t border-border">
                  <div className="flex items-center justify-center gap-2 text-muted">
                    <Calendar size={18} />
                    <span>Founded {data.founded_date}</span>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
