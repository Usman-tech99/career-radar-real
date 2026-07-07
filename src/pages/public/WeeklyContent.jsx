import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import SafeImage from '../../components/ui/SafeImage'
import { Calendar, Tag, ExternalLink, PlayCircle, FileText } from 'lucide-react'
import { Helmet } from 'react-helmet-async'

export default function WeeklyContent({ navless } = {}) {
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContent()
  }, [])

  async function fetchContent() {
    const { data, error } = await supabase
      .from('weekly_content')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (!error && data) setContent(data)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#07070C] flex flex-col">
      <Helmet>
        <title>Weekly Content — Career Radar</title>
        <meta name="description" content="Access weekly career development content, tips, guides, and resources curated by the Career Radar team." />
        <meta property="og:title" content="Weekly Content — Career Radar" />
        <meta property="og:description" content="Access weekly career development content, tips, guides, and resources curated by the Career Radar team." />
        <meta property="og:type" content="website" />
        <meta name="keywords" content="weekly content, career tips, career guides, resources, learning" />
      </Helmet>
      {!navless && <Navbar />}
      
      <main className="flex-1 pt-32 pb-20 px-4 max-w-7xl w-full mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold font-sora mb-4">Weekly <span className="text-purple-accent">Resources</span></h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">Latest insights, videos, and articles to keep you ahead of the curve. Updated every week.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="glass-card overflow-hidden animate-pulse rounded-2xl">
                <div className="w-full h-48 bg-white/[0.04]" />
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-5 w-20 rounded bg-white/[0.06]" />
                    <div className="h-4 w-24 rounded bg-white/[0.06]" />
                  </div>
                  <div className="h-5 w-full rounded bg-white/[0.06]" />
                  <div className="h-5 w-2/3 rounded bg-white/[0.06]" />
                  <div className="h-4 w-full rounded bg-white/[0.06]" />
                  <div className="h-4 w-4/5 rounded bg-white/[0.06]" />
                  <div className="h-10 w-full rounded-xl bg-white/[0.06] mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : content.length === 0 ? (
          <div className="glass-card text-center py-20 text-muted">No content available right now. Check back soon!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.map(item => (
              <div 
                key={item.id} 
                className="glass-card flex flex-col overflow-hidden p-0 hover:-translate-y-1 transition-transform group border border-border hover:border-purple-accent/50"
              >
                <SafeImage src={item.thumbnail_url} alt={item.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-accent px-2 py-1 bg-purple-accent/10 rounded">
                      {item.category}
                    </span>
                    {item.week_label && (
                      <span className="text-xs text-muted flex items-center gap-1">
                        <Calendar size={12} /> {item.week_label}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-accent transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  
                  <p className="text-sm text-muted mb-4 line-clamp-3 flex-1">
                    {item.description}
                  </p>
                  
                  <div className="flex justify-between items-end mt-auto gap-2">
                    {item.file_url ? (
                      <a href={item.file_url} target="_blank" rel="noreferrer" className="btn-ghost text-sm py-2 px-4 flex-1 text-center">
                        Download
                      </a>
                    ) : item.external_link ? (
                      <a href={item.external_link} target="_blank" rel="noreferrer" className="btn-primary text-sm py-2 px-4 flex-1 text-center flex items-center justify-center gap-2">
                        View Resource <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-xs text-muted">No link available</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      {!navless && <Footer />}
    </div>
  )
}
