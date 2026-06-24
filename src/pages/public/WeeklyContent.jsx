import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { Calendar, Tag, ExternalLink, PlayCircle, FileText } from 'lucide-react'

export default function WeeklyContent() {
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
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20 px-4 max-w-7xl w-full mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold font-sora mb-4">Weekly <span className="text-purple-accent">Resources</span></h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">Latest insights, videos, and articles to keep you ahead of the curve. Updated every week.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="skeleton h-64 rounded-2xl w-full" />)}
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
                {item.thumbnail_url ? (
                  <div className="w-full h-48 relative overflow-hidden bg-black/50">
                    <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-purple-accent/20 to-blue-accent/20 flex items-center justify-center">
                    <FileText size={48} className="text-purple-accent" />
                  </div>
                )}
                
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
      <Footer />
    </div>
  )
}
