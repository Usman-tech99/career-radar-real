import { motion } from 'framer-motion'

export function LampContainer({ children, className = '' }) {
  return (
    <div className={`relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden w-full z-0 ${className}`}>
      <div className="relative flex w-full flex-1 scale-y-[1.15] items-center justify-center isolate z-0">
        <motion.div
          initial={{ opacity: 0.3, width: '15rem' }}
          whileInView={{ opacity: 1, width: '30rem' }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="absolute inset-auto right-1/2 h-56 overflow-visible"
          style={{
            width: '30rem',
            backgroundImage: 'conic-gradient(from 70deg at center top, #10B981, transparent, transparent)',
            opacity: 0.15,
          }}
        />
        <motion.div
          initial={{ opacity: 0.3, width: '15rem' }}
          whileInView={{ opacity: 1, width: '30rem' }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="absolute inset-auto left-1/2 h-56 overflow-visible"
          style={{
            width: '30rem',
            backgroundImage: 'conic-gradient(from 290deg at center top, transparent, transparent, #10B981)',
            opacity: 0.15,
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 h-56 w-px bg-gradient-to-b from-green-500 via-green-500/50 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-green/30 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-emerald-400/20 blur-[60px]" />
        <motion.div
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
          className="relative z-10 w-full"
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}
