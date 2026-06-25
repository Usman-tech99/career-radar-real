import { useEffect, useRef } from 'react'

export default function RadarCursor() {
  const ringRef = useRef(null)
  const pulseRef = useRef(null)
  const posRef = useRef({ x: 0, y: 0 })
  const ringPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const ring = ringRef.current
    const pulse = pulseRef.current
    if (!ring || !pulse) return

    let rafId = null
    let pulseInterval = null

    function onMouseMove(e) {
      posRef.current = { x: e.clientX, y: e.clientY }
    }

    function animate() {
      ringPos.current.x += (posRef.current.x - ringPos.current.x) * 0.12
      ringPos.current.y += (posRef.current.y - ringPos.current.y) * 0.12
      ring.style.left = `${ringPos.current.x}px`
      ring.style.top = `${ringPos.current.y}px`
      rafId = requestAnimationFrame(animate)
    }

    function createPulse() {
      const dot = document.createElement('div')
      dot.className = 'radar-pulse-dot'
      dot.style.cssText = `
        position: fixed;
        width: 6px; height: 6px;
        border-radius: 50%;
        background: rgba(16, 185, 129, 0.5);
        left: ${posRef.current.x}px;
        top: ${posRef.current.y}px;
        pointer-events: none;
        z-index: 9998;
        transform: translate(-50%, -50%);
        animation: radarPulseFade 0.8s ease-out forwards;
      `
      document.body.appendChild(dot)
      setTimeout(() => dot.remove(), 800)
    }

    document.addEventListener('mousemove', onMouseMove)
    rafId = requestAnimationFrame(animate)
    pulseInterval = setInterval(createPulse, 400)

    const style = document.createElement('style')
    style.textContent = `
      @keyframes radarPulseFade {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(6); opacity: 0; }
      }
    `
    document.head.appendChild(style)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      if (rafId) cancelAnimationFrame(rafId)
      if (pulseInterval) clearInterval(pulseInterval)
      style.remove()
    }
  }, [])

  return (
    <>
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '1.5px solid rgba(16, 185, 129, 0.35)',
          boxShadow: '0 0 12px rgba(16, 185, 129, 0.15), inset 0 0 12px rgba(16, 185, 129, 0.05)',
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translate(-50%, -50%)',
          transition: 'width 0.2s, height 0.2s, border-color 0.2s',
        }}
      />
      <div
        ref={pulseRef}
        style={{
          position: 'fixed',
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.6)',
          boxShadow: '0 0 6px rgba(16, 185, 129, 0.4)',
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </>
  )
}
