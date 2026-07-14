import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'

const STORAGE_KEY = 'cr_popup_dismissed'

export default function PopupModal() {
  const location = useLocation()
  const [popup, setPopup] = useState(null)
  const [visible, setVisible] = useState(false)
  const pageReady = useRef(false)
  const exitRef = useRef(null)
  const isHome = location.pathname === '/'

  useEffect(() => {
    if (!isHome) {
      setVisible(false)
      return
    }
    const pageLoadTimer = setTimeout(() => { pageReady.current = true }, 2000)
    fetchPopup()
    return () => {
      clearTimeout(pageLoadTimer)
      if (exitRef.current) {
        document.removeEventListener('mouseleave', exitRef.current)
      }
    }
  }, [isHome])

  function handleExitIntent(e) {
    if (!pageReady.current || e.clientY > 0 || sessionStorage.getItem(STORAGE_KEY)) return
    sessionStorage.setItem(STORAGE_KEY, 'true')
    setVisible(true)
  }

  async function fetchPopup() {
    const { data } = await supabase.from('popup_settings').select('*').eq('is_active', true).order('id', { ascending: false }).limit(1).maybeSingle()
    if (!data) return
    if (data.image_url) {
      const cacheBuster = `t=${new Date(data.updated_at || data.created_at).getTime()}`
      data._imgUrl = data.image_url.includes('?') ? `${data.image_url}&${cacheBuster}` : `${data.image_url}?${cacheBuster}`
      const preload = new Image()
      preload.src = data._imgUrl
    }
    setPopup(data)
    if (data.show_on_entry && !sessionStorage.getItem(STORAGE_KEY)) {
      setTimeout(() => setVisible(true), 800)
    }
    if (data.show_on_exit) {
      exitRef.current = handleExitIntent
      document.addEventListener('mouseleave', exitRef.current)
    }
  }

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  if (!isHome || !visible || !popup) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div
        className="glass-card w-full max-w-md relative overflow-hidden rounded-2xl border border-gold/50 animate-fadeIn"
        style={{ boxShadow: '0 0 25px rgba(245,166,35,0.25), 0 0 60px rgba(245,166,35,0.1)' }}
      >
        <div className="absolute inset-0 rounded-[inherit] pointer-events-none border-2 border-gold/30" />
        <button onClick={dismiss} className="absolute top-3 right-3 text-muted hover:text-[#ffffff] z-20 bg-black/50 rounded-full p-2 transition-colors hover:bg-black/70 active:scale-95" aria-label="Close popup"><X size={20} /></button>
        {popup.image_url && <img src={popup._imgUrl || popup.image_url} alt="" className="w-full max-h-80 object-contain bg-black/30" />}
        <div className="p-6">
          <p className="text-white text-lg leading-relaxed">{popup.message}</p>
          {popup.link_url && (
            <a href={popup.link_url} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center gap-2 mt-4">
              Learn More
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
