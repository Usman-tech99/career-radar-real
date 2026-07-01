import { useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

export function BlurFade({
  children,
  className,
  duration = 0.4,
  delay = 0,
  offset = 6,
  direction = 'down',
  inView = false,
  inViewMargin = '-50px',
  blur = '6px',
}) {
  const ref = useRef(null)
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin })
  const isInView = !inView || inViewResult

  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y'
  const sign = direction === 'right' || direction === 'down' ? -1 : 1

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ [axis]: sign * offset, opacity: 0, filter: `blur(${blur})` }}
        animate={isInView ? { [axis]: 0, opacity: 1, filter: 'blur(0px)' } : {}}
        exit={{ [axis]: sign * offset, opacity: 0, filter: `blur(${blur})` }}
        transition={{ delay: 0.04 + delay, duration, ease: 'easeOut' }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}