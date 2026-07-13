import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'

const STORAGE_KEY = 'cr_popup_dismissed'

export default function PopupModal() {
  const [popup, setPopup] = useState(null)
  const [visible, setVisible] = useState(false)
  const exitAdded = useRef(false)

  useEffect(() => {
    fetchPopup()
    return () => {
      if (exitAdded.current) {
        document.removeEventListener('mouseleave', handleExitIntent)
      }
    }
  }, [])

  async function fetchPopup() {
    const { data } = await supabase.from('popup_settings').select('*').eq('is_active', true).limit(1).single()
    if (!data) return
    setPopup(data)
    if (data.show_on_entry && !sessionStorage.getItem(STORAGE_KEY)) {
      setTimeout(() => setVisible(true), 800)
    }
    if (data.show_on_exit) {
      exitAdded.current = true
      document.addEventListener('mouseleave', handleExitIntent)
    }
  }

  function handleExitIntent(e) {
    if (e.clientY > 0 || sessionStorage.getItem(STORAGE_KEY)) return
    sessionStorage.setItem(STORAGE_KEY, 'true')
    setVisible(true)
  }

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  if (!visible || !popup) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={dismiss}>
      <div
        className="glass-card w-full max-w-md relative overflow-hidden rounded-2xl border border-green/50 animate-fadeIn"
        style={{ boxShadow: '0 0 25px rgba(16,185,129,0.25), 0 0 60px rgba(16,185,129,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute inset-0 rounded-[inherit] pointer-events-none border-2 border-green/30" />
        <button onClick={dismiss} className="absolute top-4 right-4 text-muted hover:text-white z-10 bg-black/40 rounded-full p-1.5 transition-colors hover:bg-black/60"><X size={18} /></button>
        {popup.image_url && <img src={popup.image_url} alt="" loading="lazy" className="w-full max-h-80 object-contain bg-black/30" />}
        <div className="p-6">
          <p className="text-white text-lg leading-relaxed">{popup.message}</p>
          {popup.link_url && (
            <a href={popup.link_url} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center gap-2 mt-4" onClick={dismiss}>
              Learn More
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
