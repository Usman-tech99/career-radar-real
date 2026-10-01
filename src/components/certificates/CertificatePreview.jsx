import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { renderCertificateHtml, PAGE_SIZES } from '../../../supabase/functions/generate-certificate-pdf/certificateHtml.js'

const CSS_PX_PER_MM = 96 / 25.4

function pagePixels(size, orientation) {
  const dims = (PAGE_SIZES[size] || PAGE_SIZES.A4)[orientation === 'portrait' ? 'portrait' : 'landscape']
  return { width: dims.w * CSS_PX_PER_MM, height: dims.h * CSS_PX_PER_MM }
}

/**
 * Renders a certificate at true page dimensions inside a sandboxed iframe and
 * scales it to fit its container.
 *
 * This deliberately reuses the same `renderCertificateHtml` output that the
 * `generate-certificate-pdf` Edge Function prints, so the admin preview is
 * pixel-accurate rather than an approximation built from duplicated markup.
 */
export default function CertificatePreview({
  design,
  values,
  page = { size: 'A4', orientation: 'landscape' },
  className = '',
  showShadow = true,
}) {
  const containerRef = useRef(null)
  const [scale, setScale] = useState(0.3)
  const [ready, setReady] = useState(false)

  const natural = useMemo(() => pagePixels(page.size, page.orientation), [page.size, page.orientation])

  const html = useMemo(
    () => renderCertificateHtml({ design, values, page }),
    [design, values, page.size, page.orientation]
  )

  useLayoutEffect(() => {
    const element = containerRef.current
    if (!element) return

    const measure = () => {
      const available = element.clientWidth
      if (available > 0) setScale(Math.min(available / natural.width, 1))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [natural.width])

  // Wait for the iframe document (and its webfonts) so we only reveal a
  // fully-rendered page rather than flashing unstyled content.
  useEffect(() => {
    setReady(false)
    const frame = containerRef.current?.querySelector('iframe')
    if (!frame) return

    const onLoad = async () => {
      try {
        await frame.contentDocument?.fonts?.ready
      } catch {
        /* cross-origin or unavailable — render anyway */
      }
      setReady(true)
    }

    frame.addEventListener('load', onLoad)
    if (frame.contentDocument?.readyState === 'complete') onLoad()
    return () => frame.removeEventListener('load', onLoad)
  }, [html])

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div
        className={`relative origin-top-left transition-opacity duration-300 ${
          ready ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          width: natural.width,
          height: natural.height,
          transform: `scale(${scale})`,
        }}
      >
        <iframe
          title="Certificate preview"
          srcDoc={html}
          sandbox="allow-same-origin"
          className="block border-0 bg-white"
          style={{ width: natural.width, height: natural.height }}
        />
      </div>

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-7 h-7 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted">Rendering preview…</p>
          </div>
        </div>
      )}

      {/* Reserves the scaled height so surrounding layout does not jump. */}
      <div style={{ height: natural.height * scale }} aria-hidden="true" />

      {showShadow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 rounded-2xl"
          style={{
            top: natural.height * scale + 6,
            height: 22,
            background: 'radial-gradient(ellipse at center, rgba(15,23,42,0.18), transparent 70%)',
            opacity: ready ? 1 : 0,
            transition: 'opacity .3s ease',
          }}
        />
      )}
    </div>
  )
}