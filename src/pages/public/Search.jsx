import { useEffect, useRef } from 'react'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { Helmet } from 'react-helmet-async'

const CX = 'd1cd1c67ffbc44268'

export default function Search() {
  const containerRef = useRef(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    const script = document.createElement('script')
    script.src = `https://cse.google.com/cse.js?cx=${CX}`
    script.async = true
    document.head.appendChild(script)
  }, [])

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Helmet>
        <title>Search — Career Radar</title>
        <meta name="description" content="Search Career Radar for scholarships, internships, jobs, and career resources." />
        <meta name="robots" content="noindex" />
      </Helmet>
      <Navbar />
      <main className="flex-1 pt-32 pb-20 px-4 max-w-5xl w-full mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold font-sora text-white mb-8">Search Career Radar</h1>
        <div ref={containerRef} className="gcse-search" />
      </main>
      <Footer />
    </div>
  )
}
