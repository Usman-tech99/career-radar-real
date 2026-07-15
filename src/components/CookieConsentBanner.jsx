import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'cr_cookie_consent'

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return
    const timer = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-[9999] bg-navy border-t border-gold/20 px-4 py-4 shadow-2xl"
        >
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
            <p className="text-sm text-slate-100 leading-relaxed flex-1">
              This site uses cookies to improve your experience and analyze site traffic.{' '}
              <Link to="/privacy-policy" className="text-gold hover:underline whitespace-nowrap">
                Learn more
              </Link>
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={accept}
                className="px-5 py-2 bg-gold text-navy font-semibold rounded-lg text-sm hover:brightness-110 transition-all"
              >
                Accept
              </button>
              <button
                onClick={accept}
                className="p-1.5 text-slate-400 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
