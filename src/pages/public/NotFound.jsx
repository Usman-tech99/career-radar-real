import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Radar, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* scanning graphic */}
        <div className="relative mx-auto w-40 h-40 mb-8">
          <div className="absolute inset-0 rounded-full border border-gold/20 animate-ping opacity-30" />
          <div className="absolute inset-4 rounded-full border border-gold/30 animate-pulse" />
          <div className="absolute inset-8 rounded-full border border-gold/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Radar size={48} className="text-gold" />
          </div>
          {/* sweep line */}
          <motion.div
            className="absolute inset-0 rounded-full overflow-hidden"
            initial={false}
          >
            <motion.div
              className="w-[2px] h-1/2 bg-gradient-to-t from-transparent via-gold to-transparent absolute left-1/2 bottom-1/2 origin-bottom"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        </div>

        <h1 className="text-7xl font-bold font-sora text-white mb-4">404</h1>
        <p className="text-2xl font-semibold text-white mb-2">You're Out of Radar Range</p>
        <p className="text-muted mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has moved. 
          Our radar couldn't detect any signal here.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/" className="btn-primary flex items-center gap-2 px-6 py-3">
            <Home size={16} /> Return Home
          </Link>
          <button onClick={() => window.history.back()} className="btn-ghost flex items-center gap-2 px-6 py-3">
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    </div>
  )
}