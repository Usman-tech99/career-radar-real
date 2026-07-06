import { motion } from 'framer-motion'

export function LampContainer({ children, className = '' }) {
  return (
    <div className={`relative flex min-h-[80vh] flex-col items-center w-full z-0 ${className}`}>
      <div className="relative flex w-full flex-1 flex-col items-center scale-y-[1.15] isolate z-0">
        <div className="relative w-full flex items-center justify-center h-56">
          <motion.div
            initial={{ opacity: 0, width: '10rem' }}
            whileInView={{ opacity: 1, width: '30rem' }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute inset-auto right-1/2 h-full overflow-visible"
            style={{
              backgroundImage: 'conic-gradient(from 70deg at center top, #10B981, transparent, transparent)',
              opacity: 0.2,
            }}
          />
          <motion.div
            initial={{ opacity: 0, width: '10rem' }}
            whileInView={{ opacity: 1, width: '30rem' }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute inset-auto left-1/2 h-full overflow-visible"
            style={{
              backgroundImage: 'conic-gradient(from 290deg at center top, transparent, transparent, #10B981)',
              opacity: 0.2,
            }}
          />
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            whileInView={{ opacity: 1, height: '100%' }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="w-[3px] bg-gradient-to-b from-green-400 via-green-500 to-transparent"
            style={{ boxShadow: '0 0 12px rgba(16,185,129,0.6), 0 0 40px rgba(16,185,129,0.2)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-green/30 blur-[80px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-emerald-400/25 blur-[50px]"
          />
        </div>
        <motion.div
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
          className="relative z-10 w-full mt-8"
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}
