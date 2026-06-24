import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { Briefcase, MapPin, Clock, Search, ArrowUpRight } from 'lucide-react'
import { formatDate } from '../../lib/helpers'

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All')

  useEffect(() => {
    fetchJobs()
  }, [])

  async function fetchJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (!error && data) setJobs(data)
    setLoading(false)
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) || job.company.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'All' || job.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="min-h-screen bg-[#07070C] flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20 px-4 max-w-7xl w-full mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold font-sora mb-4">Remote & Local <span className="text-green">Opportunities</span></h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">Curated jobs for developers, designers, and marketers. Hand-picked for the Career Radar community.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by role or company..."
              className="w-full bg-white/[0.02] border border-border rounded-full pl-12 pr-4 py-3 focus:outline-none focus:border-green text-white"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
            {['All', 'Full-time', 'Part-time', 'Freelance', 'Remote', 'Internship'].map(type => (
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
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl w-full" />)}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="glass-card text-center py-20 text-muted">
            <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
            <p>No jobs found matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map(job => (
              <a 
                key={job.id} 
                href={job.apply_url}
                target="_blank"
                rel="noreferrer"
                className={`block p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group ${
                  job.is_featured ? 'bg-gold/5 border-gold/30 hover:shadow-gold/10' : 'bg-white/[0.02] border-border hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    {job.is_featured && <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-gold text-[#07070C] mb-2 uppercase tracking-wider">Featured</span>}
                    <h3 className="text-xl font-bold text-white group-hover:text-green transition-colors">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-muted">
                      <span className="font-medium text-white">{job.company}</span>
                      <span className="flex items-center gap-1"><MapPin size={14} /> {job.location || 'Remote'}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {job.type}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0 justify-between md:justify-end">
                    <div className="flex gap-2">
                      {job.tags?.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-xs bg-white/[0.05] border border-white/[0.1] px-2 py-1 rounded-md text-muted">{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.05] group-hover:bg-green group-hover:text-[#07070C] transition-colors shrink-0">
                      <ArrowUpRight size={20} />
                    </div>
                  </div>
                </div>
                {job.deadline && (
                  <div className="mt-4 text-xs text-red-400 font-medium">
                    Deadline: {new Date(job.deadline).toLocaleDateString()}
                  </div>
                )}
              </a>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
