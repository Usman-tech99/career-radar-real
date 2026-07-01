import { motion } from 'framer-motion'

export function BorderBeam({
  size = 50,
  delay = 0,
  duration = 6,
  colorFrom = '#00FF66',
  colorTo = '#9c40ff',
  reverse = false,
  initialOffset = 0,
  borderWidth = 1,
  className = '',
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit] border-transparent"
      style={{
        borderWidth,
        borderStyle: 'solid',
        mask: 'linear-gradient(transparent,transparent),linear-gradient(#000,#000)',
        maskClip: 'padding-box,border-box',
        WebkitMask: 'linear-gradient(transparent,transparent),linear-gradient(#000,#000)',
        WebkitMaskClip: 'padding-box,border-box',
        maskComposite: 'intersect',
        WebkitMaskComposite: 'intersect',
      }}
    >
      <motion.div
        className={`absolute aspect-square bg-gradient-to-l from-[var(--color-from)] via-[var(--color-to)] to-transparent ${className}`}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          '--color-from': colorFrom,
          '--color-to': colorTo,
        }}
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={{
          offsetDistance: reverse
            ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
            : [`${initialOffset}%`, `${100 + initialOffset}%`],
        }}
        transition={{ repeat: Infinity, ease: 'linear', duration, delay: -delay }}
      />
    </div>
  )
}