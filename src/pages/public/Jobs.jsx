import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { Briefcase, MapPin, Clock, Search, ArrowUpRight, X, ExternalLink, Calendar, Tag, Building2 } from 'lucide-react'
import { formatDate } from '../../lib/helpers'
import { Helmet } from 'react-helmet-async'

export default function Jobs({ navless } = {}) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [selectedJob, setSelectedJob] = useState(null)

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
      <Helmet>
        <title>Jobs — Career Radar</title>
        <meta name="description" content="Browse verified job opportunities for students and early-career professionals. Find internships, entry-level positions, and remote work." />
        <meta property="og:title" content="Jobs — Career Radar" />
        <meta property="og:description" content="Browse verified job opportunities for students and early-career professionals. Find internships, entry-level positions, and remote work." />
        <meta property="og:type" content="website" />
        <meta name="keywords" content="jobs, internships, entry-level, remote jobs, career opportunities" />
      </Helmet>
      {!navless && <Navbar />}
      
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
            {[1,2,3,4,5].map(i => (
              <div key={i} className="glass-card p-6 animate-pulse rounded-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1 min-w-0 space-y-3 w-full">
                    <div className="h-4 w-20 rounded bg-white/[0.06]" />
                    <div className="h-6 w-3/4 rounded bg-white/[0.06]" />
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="h-4 w-28 rounded bg-white/[0.06]" />
                      <div className="h-4 w-24 rounded bg-white/[0.06]" />
                      <div className="h-4 w-20 rounded bg-white/[0.06]" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0 justify-between md:justify-end">
                    <div className="flex gap-2">
                      <div className="h-6 w-16 rounded-md bg-white/[0.06]" />
                      <div className="h-6 w-20 rounded-md bg-white/[0.06]" />
                      <div className="h-6 w-14 rounded-md bg-white/[0.06]" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/[0.06] shrink-0" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="glass-card text-center py-20 text-muted">
            <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
            <p>No jobs found matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map(job => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={`block p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group cursor-pointer ${
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
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedJob(null)}>
          <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button onClick={() => setSelectedJob(null)} className="text-muted hover:text-white p-1"><X size={24} /></button>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">{selectedJob.title}</h2>
              <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-sm text-muted">
                <span className="flex items-center gap-1 font-medium text-white"><Building2 size={14} /> {selectedJob.company}</span>
                <span className="flex items-center gap-1"><MapPin size={14} /> {selectedJob.location || 'Remote'}</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {selectedJob.type}</span>
              </div>
            </div>

            <div className="space-y-4">
              {selectedJob.description ? (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{selectedJob.description}</p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <p className="text-sm text-muted italic">No description provided.</p>
                </div>
              )}

              {selectedJob.tags?.length > 0 && (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag size={16} className="text-blue-400" />
                    <span className="text-sm font-semibold text-white">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.tags.map((tag, i) => (
                      <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-white/[0.05] text-muted border border-white/[0.06]">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.deadline && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <Calendar size={18} className="text-red-400" />
                  <span className="text-sm text-white">Deadline: {new Date(selectedJob.deadline).toLocaleDateString()}</span>
                </div>
              )}

              {selectedJob.apply_url ? (
                <a
                  href={selectedJob.apply_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                >
                  <ExternalLink size={18} /> Apply Now
                </a>
              ) : (
                <p className="text-xs text-muted text-center mt-2">No external application link — see description above for details.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!navless && <Footer />}
    </div>
  )
}
