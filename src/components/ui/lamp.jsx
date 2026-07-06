import { motion } from 'framer-motion'

export function LampContainer({ children, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="lamp-glow"
        style={{
          position: 'absolute',
          top: '-150px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '900px',
          height: '500px',
          background: 'radial-gradient(ellipse 50% 50% at center, rgba(16, 185, 129, 0.55) 0%, rgba(16, 185, 129, 0.25) 35%, rgba(16, 185, 129, 0.08) 55%, transparent 75%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
