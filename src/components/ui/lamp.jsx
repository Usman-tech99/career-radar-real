import { motion } from 'framer-motion'

export function LampContainer({ children, className = '' }) {
  return (
    <div className={`relative flex min-h-[50vh] flex-col items-center justify-center overflow-hidden w-full ${className}`}>
      <div className="relative flex w-full flex-1 scale-y-125 items-center justify-center isolate z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 md:w-96 h-64 md:h-96 rounded-full bg-green/30 blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 md:w-60 h-40 md:h-60 rounded-full bg-emerald-400/20 blur-[120px]" />
        <motion.div
          initial={{ opacity: 0.5, y: 80 }}
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
