import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { X, Megaphone, Calendar, ExternalLink } from 'lucide-react'

const STORAGE_KEY = 'cr_announcement_dismissed'

const defaultContent = {
  headline: 'New Career Resources & Updates',
  subheading: 'Stay ahead with the latest tools, workshops, and opportunities curated for your career growth.',
  bodyText: 'Explore our recently added career planning resources, scholarship opportunities, and skill-building workshops designed to help you achieve your professional goals.\n\nVisit the resources section to learn more.',
  imageUrl: '',
  linkUrl: 'https://career-radar.space',
  buttonText: 'Learn More',
  publishedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  cardHeadline: 'Ready to Level Up?',
  badgeText: 'NEW!',
  cardParagraph: 'Discover personalized career insights and actionable steps tailored just for you.',
  cardBannerText: 'Your [highlighted yellow]career journey[/highlighted yellow] starts here.',
  cardWarningText: 'Don\'t [red bold]miss out[/red bold] on opportunities designed for your growth.',
  bgImageUrl: '',
}

export default function AnnouncementPopup({ content: propContent, show: propShow, onClose: propOnClose }) {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const dismissedRef = useRef(sessionStorage.getItem(STORAGE_KEY) === 'true')
  const fetchedRef = useRef(false)

  const isControlled = propShow !== undefined
  const [fetchedData, setFetchedData] = useState(null)
  const [selfVisible, setSelfVisible] = useState(false)

  useEffect(() => {
    if (isControlled || fetchedRef.current || dismissedRef.current) return
    fetchedRef.current = true
    fetchAnnouncement()
  }, [])

  useEffect(() => {
    if (isControlled || !selfVisible) return
    if (!isHome) setSelfVisible(false)
  }, [isHome])

  async function fetchAnnouncement() {
    const { data } = await supabase.from('announcements').select('*').eq('is_active', true).order('id', { ascending: false }).limit(1).single()
    if (!data) return
    setFetchedData(data)
    if (data.show_on_entry && !dismissedRef.current) {
      setTimeout(() => setSelfVisible(true), 800)
    }
  }

  function selfDismiss() {
    sessionStorage.setItem(STORAGE_KEY, 'true')
    dismissedRef.current = true
    setSelfVisible(false)
  }

  const show = isControlled ? propShow : (isHome && selfVisible && fetchedData)
  const c = isControlled ? { ...defaultContent, ...propContent } : { ...defaultContent, ...(fetchedData?.content || {}) }
  const onClose = isControlled ? propOnClose : selfDismiss

  useEffect(() => {
    if (!show) return
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [show, onClose])

  if (!show) return null

  function parseBannerText(text) {
    if (!text) return { before: '', highlight: '', after: '' }
    const re = /\[highlighted\s+yellow\](.*?)\[\/highlighted\]/i
    const m = text.match(re)
    if (m) {
      const idx = text.indexOf(m[0])
      return { before: text.slice(0, idx), highlight: m[1], after: text.slice(idx + m[0].length) }
    }
    return { before: text, highlight: '', after: '' }
  }

  function parseWarningText(text) {
    if (!text) return { before: '', boldPart: '', after: '' }
    const re = /\[red\s+bold\](.*?)\[\/red\s+bold\]/i
    const m = text.match(re)
    if (m) {
      const idx = text.indexOf(m[0])
      return { before: text.slice(0, idx), boldPart: m[1], after: text.slice(idx + m[0].length) }
    }
    return { before: text, boldPart: '', after: '' }
  }

  const banner = parseBannerText(c.cardBannerText)
  const warning = parseWarningText(c.cardWarningText)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-[9999] p-4 overflow-y-auto">
      <div className="relative w-full max-w-[900px] bg-white rounded-2xl shadow-2xl my-8 overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Megaphone size={20} className="text-green" />
            <span className="font-bold text-gray-900 text-lg">Latest News</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100" aria-label="Close">
            <X size={22} />
          </button>
        </div>
        <hr className="border-gray-200" />

        {/* BODY */}
        <div className="flex flex-col md:flex-row">
          {/* LEFT COLUMN - Image Card (~35%) */}
          <div className="w-full md:w-[35%] p-4 md:p-5">
            <div className="relative border border-gray-200 rounded-xl p-4 overflow-hidden min-h-[320px] flex flex-col gap-3">
              {c.bgImageUrl && (
                <img src={c.bgImageUrl} alt="" className="absolute top-0 right-0 w-32 h-32 object-cover opacity-15 pointer-events-none" />
              )}
              {c.imageUrl && (
                <img src={c.imageUrl} alt="logo" className="h-8 w-auto object-contain self-start" />
              )}
              <div className="relative z-[1] flex flex-col gap-2 flex-1">
                {c.cardHeadline && (
                  <h3 className="text-lg font-extrabold leading-tight text-gray-900">{c.cardHeadline}</h3>
                )}
                {c.badgeText && (
                  <span className="self-start bg-green text-white text-xs font-semibold px-3 py-1 rounded-full">{c.badgeText}</span>
                )}
                {c.cardParagraph && (
                  <p className="text-gray-500 text-xs leading-relaxed">{c.cardParagraph}</p>
                )}
                {c.cardBannerText && (
                  <div className="bg-[#1e2746] text-white text-[11px] leading-tight px-3 py-2 rounded">
                    {banner.before && <span>{banner.before} </span>}
                    {banner.highlight && <span className="text-yellow-300 font-bold">{banner.highlight}</span>}
                    {banner.after && <span> {banner.after}</span>}
                  </div>
                )}
                {c.cardWarningText && (
                  <p className="text-xs leading-relaxed text-gray-500">
                    {warning.before && <span>{warning.before} </span>}
                    {warning.boldPart && <span className="text-red-500 font-bold">{warning.boldPart}</span>}
                    {warning.after && <span> {warning.after}</span>}
                  </p>
                )}
              </div>
              {c.linkUrl && (
                <a href={c.linkUrl} target="_blank" rel="noreferrer" className="relative z-[1] self-start flex items-center gap-1.5 bg-green hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors">
                  <ExternalLink size={14} />
                  {c.buttonText || 'Learn More'}
                </a>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Text Content (~65%) */}
          <div className="w-full md:w-[65%] p-4 md:p-5 md:pl-0 flex flex-col gap-3">
            {c.headline && (
              <h2 className="text-gray-900 font-extrabold text-2xl md:text-[28px] leading-tight">{c.headline}</h2>
            )}
            {c.subheading && (
              <p className="text-gray-500 text-sm leading-relaxed">{c.subheading}</p>
            )}
            {c.bodyText && (
              <div className="text-gray-600 text-sm leading-relaxed space-y-2">
                {c.bodyText.split('\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
                {c.linkUrl && (
                  <p className="text-green break-all">{c.linkUrl}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <hr className="border-gray-200" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <Calendar size={14} />
            <span>Published: {c.publishedDate || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Close</button>
            {c.linkUrl && (
              <a href={c.linkUrl} target="_blank" rel="noreferrer" className="px-4 py-2 text-sm font-medium text-white bg-green rounded-lg hover:bg-emerald-500 transition-colors">{c.buttonText || 'Learn More'}</a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}