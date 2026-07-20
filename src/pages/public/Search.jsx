import { useState } from 'react'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { Helmet } from 'react-helmet-async'
import { Search as SearchIcon, ExternalLink } from 'lucide-react'

export default function Search() {
  const [query, setQuery] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!query.trim()) return
    const q = encodeURIComponent(query.trim())
    window.open(`https://www.google.com/search?q=site:career-radar.space+${q}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Helmet>
        <title>Search — Career Radar</title>
        <meta name="description" content="Search Career Radar for scholarships, internships, jobs, and career resources." />
        <meta name="robots" content="noindex" />
      </Helmet>
      <Navbar />
      <main className="flex-1 w-full pt-32 pb-20 px-4 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold font-sora text-white mb-4">Search Career Radar</h1>
        <p className="text-muted mb-8">Search the entire site via Google.</p>

        <form onSubmit={handleSubmit} className="relative">
          <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search jobs, scholarships, resources..."
            className="w-full bg-white border border-border rounded-xl pl-12 pr-4 py-4 text-navy focus:outline-none focus:border-gold text-base"
          />
        </form>

        <p className="text-sm text-muted mt-4 flex items-center gap-1.5">
          <ExternalLink size={14} />
          Results open in a new Google search tab
        </p>
      </main>
      <Footer />
    </div>
  )
}
