import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { BookOpen, Clock, ExternalLink, Filter } from 'lucide-react'

export default function Education() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('All')
  const [filterLevel, setFilterLevel] = useState('All')

  useEffect(() => {
    fetchEducation()
  }, [])

  async function fetchEducation() {
    const { data, error } = await supabase
      .from('education_items')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })

    if (!error && data) setItems(data)
    setLoading(false)
  }

  const filteredItems = items.filter(item => {
    const matchesType = filterType === 'All' || item.type === filterType
    const matchesLevel = filterLevel === 'All' || item.level === filterLevel
    return matchesType && matchesLevel
  })

  const levelBadgeColor = (level) => {
    switch(level) {
      case 'Beginner': return 'badge-green'
      case 'Intermediate': return 'badge-gold'
      case 'Advanced': return 'badge-red'
      default: return 'badge-blue'
    }
  }

  return (
    <div className="min-h-screen bg-[#07070C] flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20 px-4 max-w-7xl w-full mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold font-sora mb-4">Education <span className="text-green">Hub</span></h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">Curated courses, books, and guides to accelerate your career growth.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 justify-between items-center">
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {['All', 'Course', 'Book', 'Guide', 'Workshop'].map(type => (
              <button 
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                  filterType === type ? 'bg-green text-[#07070C]' : 'bg-white/[0.05] text-muted hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <Filter size={18} className="text-muted self-center mr-2" />
            {['All', 'Beginner', 'Intermediate', 'Advanced'].map(level => (
              <button 
                key={level}
                onClick={() => setFilterLevel(level)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                  filterLevel === level ? 'bg-blue-accent text-[#07070C]' : 'bg-white/[0.05] text-muted hover:text-white'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Education Items */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="skeleton h-80 rounded-2xl w-full" />)}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="glass-card text-center py-20 text-muted">
            <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p>No education items found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                className="glass-card flex flex-col overflow-hidden hover:-translate-y-1 transition-transform group"
              >
                {item.thumbnail_url ? (
                  <div className="w-full h-48 relative overflow-hidden bg-black/50">
                    <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-green/20 to-blue-accent/20 flex items-center justify-center">
                    <BookOpen size={48} className="text-green" />
                  </div>
                )}
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${levelBadgeColor(item.level)}`}>
                      {item.level}
                    </span>
                    <span className="text-xs text-muted flex items-center gap-1">
                      <BookOpen size={12} /> {item.type}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  
                  <p className="text-sm text-muted mb-4 line-clamp-3 flex-1">
                    {item.description}
                  </p>
                  
                  {item.duration_label && (
                    <div className="flex items-center gap-2 text-xs text-muted mb-4">
                      <Clock size={12} /> {item.duration_label}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.topics_covered?.slice(0, 3).map((topic, i) => (
                      <span key={i} className="text-xs bg-white/[0.05] border border-white/[0.1] px-2 py-1 rounded text-muted">
                        {topic}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-auto">
                    {item.is_free ? (
                      item.free_access_url ? (
                        <a href={item.free_access_url} target="_blank" rel="noreferrer" className="btn-primary w-full text-center py-2 flex items-center justify-center gap-2">
                          Access Now <ExternalLink size={14} />
                        </a>
                      ) : (
                        <span className="text-green text-sm font-medium">Free Content</span>
                      )
                    ) : (
                      <Link to="/shop" className="btn-ghost w-full text-center py-2">
                        View in Shop
                      </Link>
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
