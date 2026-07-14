import { motion } from 'framer-motion'

export function LampContainer({ children, className = '' }) {
  return (
    <div className={`relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-surface w-full z-0 ${className}`}>
      <div className="absolute inset-0 scale-y-125 pointer-events-none">
        <motion.div
          initial={{ opacity: 0.3, width: '10rem' }}
          whileInView={{ opacity: 0.7, width: '20rem' }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="absolute inset-auto right-1/2 h-56 overflow-visible"
          style={{
            backgroundImage: 'conic-gradient(from 70deg at center top, rgba(245,166,35,0.5), transparent, transparent)',
          }}
        >
          <div
            className="absolute w-full left-0 h-40 bottom-0 z-20"
            style={{ background: 'var(--color-bg-dark)', maskImage: 'linear-gradient(to top, white, transparent)', WebkitMaskImage: 'linear-gradient(to top, white, transparent)' }}
          />
          <div
            className="absolute w-40 h-full left-0 bottom-0 z-20"
            style={{ background: 'var(--color-bg-dark)', maskImage: 'linear-gradient(to right, white, transparent)', WebkitMaskImage: 'linear-gradient(to right, white, transparent)' }}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0.3, width: '10rem' }}
          whileInView={{ opacity: 0.7, width: '20rem' }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="absolute inset-auto left-1/2 h-56 overflow-visible"
          style={{
            backgroundImage: 'conic-gradient(from 290deg at center top, transparent, transparent, rgba(245,166,35,0.5))',
          }}
        >
          <div
            className="absolute w-40 h-full right-0 bottom-0 z-20"
            style={{ background: 'var(--color-bg-dark)', maskImage: 'linear-gradient(to left, white, transparent)', WebkitMaskImage: 'linear-gradient(to left, white, transparent)' }}
          />
          <div
            className="absolute w-full right-0 h-40 bottom-0 z-20"
            style={{ background: 'var(--color-bg-dark)', maskImage: 'linear-gradient(to top, white, transparent)', WebkitMaskImage: 'linear-gradient(to top, white, transparent)' }}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, width: '8rem' }}
          whileInView={{ opacity: 0.6, width: '14rem' }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 rounded-full"
          style={{
            background: 'radial-gradient(ellipse 60% 60% at center, rgba(245, 166, 35, 0.2) 0%, rgba(245, 166, 35, 0.08) 40%, transparent 75%)',
            filter: 'blur(80px)',
          }}
        />
      </div>
      <motion.div
        initial={{ opacity: 0.5 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
        className="relative z-10 w-full -mt-24"
      >
        {children}
      </motion.div>
    </div>
  )
}
