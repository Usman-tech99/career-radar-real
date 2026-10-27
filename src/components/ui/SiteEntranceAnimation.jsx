import { useEffect, useRef, useState } from 'react'
import logo from '../../assets/logo.jpeg'

/**
 * SiteEntranceAnimation
 *
 * Implements the 3-phase responsive logo entrance and travel animation:
 * Phase 1 (Entrance): Locks body scroll, presents full-screen loader (#0F1B33),
 *                      animates #animated-logo in viewport center with pulse and gold glow (1.2s).
 * Phase 2 (Travel):   Dynamically computes #nav-logo coordinates via getBoundingClientRect(),
 *                      travels and scales down to scale(1) using cubic-bezier(0.76, 0, 0.24, 1) over 0.9s,
 *                      while loader overlay fades out and hero section reveals.
 * Phase 3 (Cleanup):  Seamlessly reveals real #nav-logo (opacity 1), cleans up overlay, unlocks scrolling.
 */
export default function SiteEntranceAnimation({ onPhase2Start, onComplete }) {
  const [active, setActive] = useState(true)
  const [phase, setPhase] = useState('entrance') // 'entrance' | 'moving' | 'done'
  const overlayRef = useRef(null)
  const animatedLogoRef = useRef(null)

  useEffect(() => {
    // 1. Accessibility: Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      skipAnimation()
      return
    }

    // 2. Optional Session Storage: Uncomment below to play once per session
    // if (sessionStorage.getItem('career_radar_intro_played')) {
    //   skipAnimation()
    //   return
    // }

    // Lock body scrolling during animation
    document.body.style.overflow = 'hidden'

    function skipAnimation() {
      setActive(false)
      document.body.style.overflow = ''
      const navLogo = document.getElementById('nav-logo')
      if (navLogo) navLogo.style.opacity = '1'
      onPhase2Start?.()
      onComplete?.()
    }

    // Phase 1 -> Phase 2 Timer (1.2s entrance pulse)
    const phase1Timer = setTimeout(() => {
      runPhase2()
    }, 1200)

    function runPhase2() {
      const navLogo = document.getElementById('nav-logo')
      const animatedLogo = animatedLogoRef.current
      const overlay = overlayRef.current

      if (!navLogo || !animatedLogo || !overlay) {
        skipAnimation()
        return
      }

      // Dynamic coordinate calculation using getBoundingClientRect()
      // Guarantees 100% pixel-perfect coordinates across Desktop, Tablet & Mobile
      const rect = navLogo.getBoundingClientRect()
      const targetCenterX = rect.left + rect.width / 2
      const targetCenterY = rect.top + rect.height / 2

      setPhase('moving')

      // Notify parent to trigger hero section upward reveal
      onPhase2Start?.()

      // Animate logo to exact navbar coordinates
      animatedLogo.style.transition =
        'top 0.9s cubic-bezier(0.76, 0, 0.24, 1), left 0.9s cubic-bezier(0.76, 0, 0.24, 1), transform 0.9s cubic-bezier(0.76, 0, 0.24, 1), box-shadow 0.9s ease'
      animatedLogo.style.top = `${targetCenterY}px`
      animatedLogo.style.left = `${targetCenterX}px`
      animatedLogo.style.transform = 'translate(-50%, -50%) scale(1)'
      animatedLogo.style.boxShadow = '0 0 10px rgba(245, 166, 35, 0.2)'

      // Simultaneously fade out the loader overlay background
      overlay.style.transition =
        'background-color 0.9s cubic-bezier(0.76, 0, 0.24, 1), backdrop-filter 0.9s cubic-bezier(0.76, 0, 0.24, 1)'
      overlay.style.backgroundColor = 'transparent'
      overlay.style.backdropFilter = 'blur(0px)'
      overlay.style.pointerEvents = 'none'

      // Listen for transition end on transform for seamless Phase 3 handoff
      let cleanedUp = false
      const handleTransitionEnd = (e) => {
        if (e.propertyName === 'transform') {
          animatedLogo.removeEventListener('transitionend', handleTransitionEnd)
          cleanupPhase3()
        }
      }

      function cleanupPhase3() {
        if (cleanedUp) return
        cleanedUp = true

        // Phase 3: Seamless Swap & Cleanup
        navLogo.style.opacity = '1'
        setActive(false)
        setPhase('done')
        document.body.style.overflow = ''

        // Uncomment if session storage is desired:
        // sessionStorage.setItem('career_radar_intro_played', 'true')

        onComplete?.()
      }

      animatedLogo.addEventListener('transitionend', handleTransitionEnd)

      // Fallback safety timer (0.9s + 80ms)
      setTimeout(cleanupPhase3, 980)
    }

    return () => {
      clearTimeout(phase1Timer)
      document.body.style.overflow = ''
    }
  }, [onComplete, onPhase2Start])

  if (!active) return null

  return (
    <div
      id="loader-overlay"
      ref={overlayRef}
      className="fixed inset-0 w-screen h-screen z-[9999] bg-[#0F1B33] flex items-center justify-center pointer-events-auto overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Decorative radar pulses in overlay background */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full border border-amber-400/[0.12] animate-ping opacity-25" style={{ animationDuration: '3s' }} />
        <div className="absolute w-[440px] h-[440px] rounded-full border border-amber-400/[0.10]" />
        <div className="absolute w-[280px] h-[280px] rounded-full border border-amber-400/[0.08]" />
      </div>

      {/* Duplicate animated logo */}
      <div
        id="animated-logo"
        ref={animatedLogoRef}
        className={`w-14 h-14 rounded-full border-2 border-amber-400 overflow-hidden bg-white flex items-center justify-center shadow-[0_0_35px_rgba(245,166,35,0.7)] ${
          phase === 'entrance' ? 'animate-logo-pulse' : ''
        }`}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(2.5)',
          willChange: 'top, left, transform, opacity, box-shadow',
          zIndex: 10000,
        }}
      >
        <img
          src={logo}
          alt="Career Radar"
          className="w-full h-full object-cover"
          draggable="false"
        />
      </div>

      {/* Brand title under the pulsing logo during Phase 1 */}
      <div
        className="absolute left-1/2 text-center pointer-events-none transition-all duration-400 ease-out"
        style={{
          top: 'calc(50% + 96px)',
          transform: phase === 'entrance' ? 'translate(-50%, 0)' : 'translate(-50%, 14px)',
          opacity: phase === 'entrance' ? 1 : 0,
          transitionDelay: phase === 'entrance' ? '180ms' : '0ms',
        }}
      >
        <div className="flex flex-col items-center">
          <h2 className="text-base sm:text-lg font-black uppercase tracking-[0.35em] text-amber-400 drop-shadow-[0_2px_14px_rgba(245,166,35,0.5)] whitespace-nowrap">
            Career Radar
          </h2>
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300/80 mt-1.5 whitespace-nowrap">
            AI-Powered Career GPS
          </span>
        </div>
      </div>

      {/* Scoped CSS for Keyframes */}
      <style>{`
        @keyframes logoPulse {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(2.0);
            box-shadow: 0 0 0 rgba(245, 166, 35, 0);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(2.6);
            box-shadow: 0 0 45px rgba(245, 166, 35, 0.85);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(2.5);
            box-shadow: 0 0 30px rgba(245, 166, 35, 0.65);
          }
        }
        .animate-logo-pulse {
          animation: logoPulse 1.2s ease forwards;
        }
      `}</style>
    </div>
  )
}
