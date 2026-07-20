import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { Helmet } from 'react-helmet-async'
import { Search as SearchIcon, Briefcase, GraduationCap, BookOpen, Package, Calendar, Users, User, Globe } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const SEARCH_LIMIT = 6

const categories = [
  { key: 'jobs', icon: Briefcase, color: 'text-blue-accent', label: 'Jobs', path: '/jobs' },
  { key: 'scholarships', icon: GraduationCap, color: 'text-gold', label: 'Scholarships', path: '/scholarships' },
  { key: 'education', icon: BookOpen, color: 'text-purple-accent', label: 'Education', path: '/education' },
  { key: 'products', icon: Package, color: 'text-gold', label: 'Products', path: '/products' },
  { key: 'weekly', icon: Calendar, color: 'text-blue-accent', label: 'Weekly Content', path: '/weekly-content' },
  { key: 'collaborators', icon: Users, color: 'text-gold', label: 'Collaborators', path: '/collaborators' },
  { key: 'team', icon: User, color: 'text-purple-accent', label: 'Team', path: '/team' },
  { key: 'socials', icon: Globe, color: 'text-blue-accent', label: 'Social', path: '/social' },
]

function searchJobs(query) {
  const q = `%${query}%`
  return supabase.from('jobs').select('id, title, company, location, type, tags, created_at').eq('is_active', true).or(`title.ilike.${q},company.ilike.${q},description.ilike.${q},location.ilike.${q}`).order('created_at', { ascending: false }).limit(SEARCH_LIMIT)
}

function searchScholarships(query) {
  const q = `%${query}%`
  return supabase.from('scholarships').select('id, title, provider, country, coverage, deadline').or(`title.ilike.${q},provider.ilike.${q},country.ilike.${q},description.ilike.${q},eligibility.ilike.${q}`).order('created_at', { ascending: false }).limit(SEARCH_LIMIT)
}

function searchEducation(query) {
  const q = `%${query}%`
  return supabase.from('education_items').select('id, title, type, level, is_free, duration_label').eq('is_published', true).or(`title.ilike.${q},description.ilike.${q},topics_covered.cs.{${query}}`).order('created_at', { ascending: false }).limit(SEARCH_LIMIT)
}

function searchProducts(query) {
  const q = `%${query}%`
  return supabase.from('products').select('id, title, category, is_free, price_pkr').eq('is_active', true).or(`title.ilike.${q},description.ilike.${q}`).order('created_at', { ascending: false }).limit(SEARCH_LIMIT)
}

function searchWeekly(query) {
  const q = `%${query}%`
  return supabase.from('weekly_content').select('id, title, category, week_label, created_at').eq('is_published', true).or(`title.ilike.${q},description.ilike.${q}`).order('created_at', { ascending: false }).limit(SEARCH_LIMIT)
}

function searchCollaborators(query) {
  const q = `%${query}%`
  return supabase.from('collaborators').select('id, name, collaboration_type').eq('is_active', true).or(`name.ilike.${q},description.ilike.${q}`).order('sort_order', { ascending: true }).limit(SEARCH_LIMIT)
}

function searchTeam(query) {
  const q = `%${query}%`
  return supabase.from('team_members').select('id, name, role').eq('is_active', true).or(`name.ilike.${q},role.ilike.${q},skills.cs.{${query}}`).order('sort_order', { ascending: true }).limit(SEARCH_LIMIT)
}

function searchSocials(query) {
  const q = `%${query}%`
  return supabase.from('socials').select('id, platform_name, platform_type, handle_or_name, description').eq('is_active', true).or(`platform_name.ilike.${q},description.ilike.${q},handle_or_name.ilike.${q}`).order('sort_order', { ascending: true }).limit(SEARCH_LIMIT)
}

const searches = {
  jobs: searchJobs,
  scholarships: searchScholarships,
  education: searchEducation,
  products: searchProducts,
  weekly: searchWeekly,
  collaborators: searchCollaborators,
  team: searchTeam,
  socials: searchSocials,
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults(null); return }
    setLoading(true)
    const entries = await Promise.all(
      Object.entries(searches).map(([key, fn]) =>
        fn(q.trim()).then(({ data, error }) => ({ key, data: error ? [] : (data || []) }))
      )
    )
    const grouped = {}
    for (const { key, data } of entries) {
      if (data.length > 0) grouped[key] = data
    }
    setResults(grouped)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (initialQuery) doSearch(initialQuery)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setSearchParams({ q })
    doSearch(q)
  }

  const totalResults = results ? Object.values(results).reduce((sum, arr) => sum + arr.length, 0) : 0

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Helmet>
        <title>{query ? `${query} — Search Results` : 'Search'} — Career Radar</title>
        <meta name="description" content="Search Career Radar for scholarships, internships, jobs, and career resources." />
        <meta name="robots" content="noindex" />
      </Helmet>
      <Navbar />
      <main className="flex-1 w-full pt-32 pb-20 px-4 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold font-sora text-white mb-6">Search Career Radar</h1>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search jobs, scholarships, resources..."
              className="w-full bg-white border border-border rounded-xl pl-12 pr-4 py-4 text-navy focus:outline-none focus:border-gold text-base"
            />
          </div>
          <button type="submit" className="btn-primary px-6 py-4 rounded-xl text-sm font-semibold shrink-0">
            Search
          </button>
        </form>

        {loading && <p className="text-muted text-center py-12">Searching...</p>}

        {results && !loading && totalResults === 0 && (
          <p className="text-muted text-center py-12">No results found for &ldquo;{query}&rdquo;.</p>
        )}

        {results && !loading && totalResults > 0 && (
          <div className="space-y-8">
            {categories.map(({ key, icon: Icon, color, label, path }) => {
              const items = results[key]
              if (!items || items.length === 0) return null
              return (
                <div key={key}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={18} className={color} />
                    <h2 className="text-lg font-bold text-white">{label}</h2>
                    <span className="text-xs text-muted">({items.length})</span>
                  </div>
                  <div className="space-y-2">
                    {items.map(item => (
                      <Link
                        key={item.id}
                        to={path}
                        className="block glass-card p-4 hover:border-gold/40 transition-colors"
                      >
                        <p className="font-semibold text-white text-sm">{item.title || item.name || item.platform_name}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {item.company && `${item.company}${item.location ? ` — ${item.location}` : ''}`}
                          {item.provider && `${item.provider}${item.country ? ` — ${item.country}` : ''}`}
                          {item.role && `${item.role}`}
                          {item.platform_type && `${item.platform_type}${item.handle_or_name ? ` — ${item.handle_or_name}` : ''}`}
                          {item.collaboration_type && item.collaboration_type}
                          {item.type && item.type}
                          {item.category && item.category}
                          {item.is_free && 'Free'}
                          {item.week_label && item.week_label}
                        </p>
                      </Link>
                    ))}
                    <Link to={path} className="text-xs text-gold hover:underline block mt-1">View all {label} &rarr;</Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
