import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import SafeImage from '../../components/ui/SafeImage'
import { GraduationCap, Search, MapPin, Calendar, ExternalLink, X } from 'lucide-react'
import { formatDate } from '../../lib/helpers'

const coverageOptions = ['All', 'Fully Funded', 'Partial Tuition', 'Monthly Stipend', 'Other']

export default function Scholarships({ navless } = {}) {
  const [scholarships, setScholarships] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCoverage, setFilterCoverage] = useState('All')
  const [filterCountry, setFilterCountry] = useState('All')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchScholarships()
  }, [])

  async function fetchScholarships() {
    const { data, error } = await supabase
      .from('scholarships')
      .select('*')
      .order('deadline', { ascending: true, nullsLast: true })
    if (!error && data) setScholarships(data)
    setLoading(false)
  }

  const countries = ['All', ...new Set(scholarships.map(s => s.country).filter(Boolean))].sort()

  const filtered = scholarships.filter(s => {
    const q = search.toLowerCase()
    if (q && !s.title.toLowerCase().includes(q) && !s.provider.toLowerCase().includes(q) && !(s.eligibility || '').toLowerCase().includes(q)) return false
    if (filterCoverage !== 'All' && s.coverage !== filterCoverage) return false
    if (filterCountry !== 'All' && s.country !== filterCountry) return false
    return true
  })

  return (
    <div className="min-h-screen bg-[#07070C] flex flex-col">
      {!navless && <Navbar />}

      <main className="flex-1 pt-32 pb-20 px-4 max-w-7xl w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green/10 border border-green/20 text-green text-xs font-bold uppercase tracking-wider mb-4">
            <GraduationCap size={14} /> Scholarships
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-sora mb-4">
            Global <span className="text-gold">Opportunities</span>
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Discover fully funded scholarships and financial aid programs from around the world.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, provider, or eligibility..."
              className="input-field pl-11 w-full"
            />
          </div>
          <select value={filterCoverage} onChange={e => setFilterCoverage(e.target.value)} className="input-field w-full lg:w-48">
            {coverageOptions.map(c => <option key={c} value={c}>{c === 'All' ? 'All Coverage' : c}</option>)}
          </select>
          <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} className="input-field w-full lg:w-48">
            {countries.map(c => <option key={c} value={c}>{c === 'All' ? 'All Countries' : c}</option>)}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-80 rounded-2xl w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card text-center py-20 text-muted">
            <GraduationCap size={48} className="mx-auto mb-4 opacity-50" />
            <p>No scholarships match your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(s => (
              <div
                key={s.id}
                onClick={() => setSelected(s)}
                className="glass-card flex flex-col overflow-hidden cursor-pointer hover:-translate-y-1 transition-all group"
              >
                <div className="relative h-44 bg-surface flex items-center justify-center p-6">
                  <SafeImage src={s.image_url} alt={s.title} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500" />
                  <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded ${
                    s.coverage === 'Fully Funded' ? 'bg-green/20 text-green' :
                    s.coverage === 'Partial Tuition' ? 'bg-gold/20 text-gold' :
                    s.coverage === 'Monthly Stipend' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-white/10 text-white'
                  }`}>{s.coverage}</span>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-gold transition-colors line-clamp-2">{s.title}</h3>
                  <p className="text-sm text-muted mb-3">{s.provider}</p>
                  <div className="flex items-center gap-4 text-xs text-muted mt-auto">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {s.country}</span>
                    {s.deadline && <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(s.deadline)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <SafeImage src={selected.image_url} alt={selected.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold">{selected.title}</h2>
                  <p className="text-muted">{selected.provider}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted hover:text-white shrink-0"><X size={24} /></button>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <span className={`text-xs font-bold px-3 py-1 rounded ${
                selected.coverage === 'Fully Funded' ? 'bg-green/20 text-green' :
                selected.coverage === 'Partial Tuition' ? 'bg-gold/20 text-gold' :
                selected.coverage === 'Monthly Stipend' ? 'bg-blue-500/20 text-blue-400' :
                'bg-white/10 text-white'
              }`}>{selected.coverage}</span>
              <span className="text-xs bg-white/[0.05] border border-white/[0.1] px-3 py-1 rounded text-muted flex items-center gap-1">
                <MapPin size={12} /> {selected.country}
              </span>
              {selected.deadline && (
                <span className="text-xs bg-white/[0.05] border border-white/[0.1] px-3 py-1 rounded text-muted flex items-center gap-1">
                  <Calendar size={12} /> Deadline: {formatDate(selected.deadline)}
                </span>
              )}
            </div>

            {selected.eligibility && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Eligibility</h4>
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-sm text-muted whitespace-pre-wrap">{selected.eligibility}</div>
              </div>
            )}

            {selected.description && (
              <div className="mb-8">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Description</h4>
                <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{selected.description}</p>
              </div>
            )}

            <a
              href={selected.apply_url}
              target="_blank"
              rel="noreferrer"
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
            >
              Apply Now <ExternalLink size={18} />
            </a>
          </div>
        </div>
      )}

      {!navless && <Footer />}
    </div>
  )
}