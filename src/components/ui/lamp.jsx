import { motion } from 'framer-motion'

export function LampContainer({ children, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute left-1/2 -translate-x-1/2 -top-28 w-[700px] h-[350px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(20,184,166,0.5) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <motion.div
        initial={{ opacity: 0.5, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  )
}
