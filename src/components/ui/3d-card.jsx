import { createContext, useContext, useRef, useCallback, useEffect } from 'react'
import { cn } from '../../lib/utils'

const MouseEnterContext = createContext(null)

export function CardContainer({ children, className, containerClassName }) {
  const containerRef = useRef(null)
  const isMouseEntered = useRef(false)

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return
    const { left, top, width, height } = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - left - width / 2) / 25
    const y = (e.clientY - top - height / 2) / 25
    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`
  }, [])

  const handleMouseEnter = useCallback(() => {
    isMouseEntered.current = true
  }, [])

  const handleMouseLeave = useCallback(() => {
    isMouseEntered.current = false
    if (containerRef.current) {
      containerRef.current.style.transform = 'rotateY(0deg) rotateX(0deg)'
    }
  }, [])

  return (
    <MouseEnterContext.Provider value={isMouseEntered}>
      <div
        className={cn('flex items-center justify-center', containerClassName)}
        style={{ perspective: '1000px' }}
      >
        <div
          ref={containerRef}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={cn('relative transition-all duration-200 ease-linear', className)}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  )
}

export function CardBody({ children, className }) {
  return (
    <div className={cn('', className)} style={{ transformStyle: 'preserve-3d' }}>
      {children}
    </div>
  )
}

export function CardItem({ as: Tag = 'div', children, className, translateX = 0, translateY = 0, translateZ = 0, rotateX = 0, rotateY = 0, rotateZ = 0, ...rest }) {
  const ref = useRef(null)
  const isMouseEntered = useContext(MouseEnterContext)

  const handleAnimations = useCallback(() => {
    if (!ref.current) return
    if (isMouseEntered?.current) {
      ref.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`
    } else {
      ref.current.style.transform = 'translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)'
    }
  }, [isMouseEntered, translateX, translateY, translateZ, rotateX, rotateY, rotateZ])

  useEffect(() => { handleAnimations() }, [handleAnimations])

  return (
    <Tag ref={ref} className={cn('transition-all duration-200 ease-linear', className)} style={{ transformStyle: 'preserve-3d' }} {...rest}>
      {children}
    </Tag>
  )
}
