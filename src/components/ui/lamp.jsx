import { motion } from 'framer-motion'

export function LampContainer({ children, className = '' }) {
  return (
    <div className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#07070C] w-full z-0 ${className}`}>
      <div className="relative flex w-full flex-1 scale-y-125 items-center justify-center isolate z-0">
        <motion.div
          initial={{ opacity: 0.5, width: '15rem' }}
          whileInView={{ opacity: 1, width: '30rem' }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="absolute inset-auto right-1/2 h-56 overflow-visible"
          style={{
            backgroundImage: 'conic-gradient(from 70deg at center top, #10B981, transparent, transparent)',
          }}
        >
          <div
            className="absolute w-full left-0 h-40 bottom-0 z-20"
            style={{ background: '#07070C', maskImage: 'linear-gradient(to top, white, transparent)', WebkitMaskImage: 'linear-gradient(to top, white, transparent)' }}
          />
          <div
            className="absolute w-40 h-full left-0 bottom-0 z-20"
            style={{ background: '#07070C', maskImage: 'linear-gradient(to right, white, transparent)', WebkitMaskImage: 'linear-gradient(to right, white, transparent)' }}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0.5, width: '15rem' }}
          whileInView={{ opacity: 1, width: '30rem' }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="absolute inset-auto left-1/2 h-56 overflow-visible"
          style={{
            backgroundImage: 'conic-gradient(from 290deg at center top, transparent, transparent, #10B981)',
          }}
        >
          <div
            className="absolute w-40 h-full right-0 bottom-0 z-20"
            style={{ background: '#07070C', maskImage: 'linear-gradient(to left, white, transparent)', WebkitMaskImage: 'linear-gradient(to left, white, transparent)' }}
          />
          <div
            className="absolute w-full right-0 h-40 bottom-0 z-20"
            style={{ background: '#07070C', maskImage: 'linear-gradient(to top, white, transparent)', WebkitMaskImage: 'linear-gradient(to top, white, transparent)' }}
          />
        </motion.div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-40 bg-gradient-to-b from-green-400 via-green-500 to-transparent" style={{ boxShadow: '0 0 8px rgba(16,185,129,0.4)' }} />
        <motion.div
          initial={{ opacity: 0, width: '10rem' }}
          whileInView={{ opacity: 1, width: '20rem' }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 h-32 rounded-full"
          style={{ background: '#10B981', filter: 'blur(100px)', opacity: 0.15 }}
        />
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
