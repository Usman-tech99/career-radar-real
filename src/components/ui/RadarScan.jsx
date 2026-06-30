import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

const RINGS = 4
const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899']

function randomBlip() {
  const angle = Math.random() * Math.PI * 2
  const radius = 0.15 + Math.random() * 0.6
  return { angle, radius, color: COLORS[Math.floor(Math.random() * COLORS.length)] }
}

function Blip({ blip, index }) {
  const x = Math.cos(blip.angle) * blip.radius * 100
  const y = Math.sin(blip.angle) * blip.radius * 100

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0.6, 0], scale: [0, 1.2, 1, 0] }}
      transition={{ duration: 2.5, ease: 'easeOut', delay: index * 0.15 }}
      className="absolute w-2 h-2 rounded-full"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        backgroundColor: blip.color,
        boxShadow: `0 0 6px ${blip.color}, 0 0 12px ${blip.color}40`,
      }}
    />
  )
}

export default function RadarScan({ className = '' }) {
  const [blips, setBlips] = useState([])
  const [isScanning, setIsScanning] = useState(true)
  const blipIdRef = useRef(0)

  const spawnBlip = useCallback(() => {
    blipIdRef.current += 1
    const id = blipIdRef.current
    setBlips(prev => [...prev, { id, blip: randomBlip() }])
    setTimeout(() => {
      setBlips(prev => prev.filter(b => b.id !== id))
    }, 3000)
  }, [])

  useEffect(() => {
    if (!isScanning) return
    const interval = setInterval(spawnBlip, 400)
    const initialBatch = [0, 1, 2, 3, 4].map(() => {
      blipIdRef.current += 1
      const id = blipIdRef.current
      setTimeout(() => {
        setBlips(prev => prev.filter(b => b.id !== id))
      }, 3000)
      return { id, blip: randomBlip() }
    })
    setBlips(initialBatch)
    return () => clearInterval(interval)
  }, [isScanning, spawnBlip])

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Main container */}
      <div className="relative w-72 h-72 md:w-80 md:h-80">
        {/* Outer glow */}
        <div className="absolute inset-0 bg-green/5 rounded-full blur-3xl" />

        {/* Radar screen */}
        <div className="relative w-full h-full rounded-full border border-green/30 bg-[#0a1a12]/90 backdrop-blur-sm overflow-hidden shadow-[0_0_60px_-20px_rgba(16,185,129,0.3),inset_0_0_80px_-40px_rgba(16,185,129,0.1)]">
          
          {/* Scan lines overlay */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(16,185,129,1) 2px, rgba(16,185,129,1) 3px)',
            backgroundSize: '100% 4px',
          }} />

          {/* Concentric rings */}
          {Array.from({ length: RINGS }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-green/10"
              style={{
                inset: `${12 + i * 18}%`,
                boxShadow: 'inset 0 0 20px -10px rgba(16,185,129,0.1)',
              }}
            />
          ))}

          {/* Crosshairs */}
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-green/10" />
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-green/10" />

          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="w-4 h-4 rounded-full bg-green shadow-[0_0_20px_rgba(16,185,129,0.8),0_0_40px_rgba(16,185,129,0.4)]" />
          </div>

          {/* Rotating sweep beam */}
          <motion.div
            animate={isScanning ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 z-10 pointer-events-none"
            style={{ transformOrigin: 'center' }}
          >
            <div
              className="absolute top-1/2 left-1/2 h-[50%] w-[2px] origin-bottom"
              style={{
                background: 'linear-gradient(to top, rgba(16,185,129,0.8), rgba(16,185,129,0.2), transparent)',
                boxShadow: '0 0 20px 4px rgba(16,185,129,0.3)',
              }}
            />
            <div
              className="absolute top-1/2 left-1/2 w-[50%] h-[50%] origin-bottom"
              style={{
                background: 'conic-gradient(from 180deg, rgba(16,185,129,0.15), transparent 60deg)',
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
              }}
            />
          </motion.div>

          {/* Blips */}
          {blips.map(({ id, blip }) => (
            <Blip key={id} blip={blip} index={id} />
          ))}
        </div>

        {/* Ring pulse */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full border border-green/20 pointer-events-none"
        />

        {/* Label */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-xs font-bold tracking-[0.25em] text-green/60 uppercase">Scanning Opportunities</span>
        </div>
      </div>
    </div>
  )
}