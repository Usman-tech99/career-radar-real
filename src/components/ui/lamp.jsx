import { motion } from 'framer-motion'

export function LampContainer({ children, className = '' }) {
  return (
    <div className={`relative flex flex-col items-center justify-center w-full ${className}`}>
      <div className="relative flex w-full items-center justify-center isolate z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 md:w-[500px] h-80 md:h-[500px] rounded-full bg-green/25 blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 md:w-72 h-48 md:h-72 rounded-full bg-emerald-400/20 blur-[100px]" />
        <motion.div
          initial={{ opacity: 0.5, y: 60 }}
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
