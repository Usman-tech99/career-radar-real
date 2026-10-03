/**
 * CertificateAppreciationPreview
 *
 * A self-contained browser component that renders the Career Radar
 * "Certificate of Appreciation" design directly in the admin UI.
 *
 * It uses the SAME visual tokens as the Supabase edge-function renderer
 * but is implemented as pure JSX/inline-SVG so it can run in a browser
 * without importing any server-side modules.
 *
 * The design is drawn at a fixed 1190×842 px (A4 landscape @ 100 dpi)
 * and then CSS-scaled to fill whatever container it lives in.
 */

import { useLayoutEffect, useRef, useState } from 'react'

// ── Design tokens (mirror certificateHtml.js cr_appreciation renderer) ───────
const C = {
  navy:      '#0A1628',
  navyMid:   '#0D1E3A',
  gold:      '#C9993C',
  goldLight: '#E5C46E',
  goldPale:  '#F5E6C3',
  white:     '#FFFFFF',
  cream:     '#FDF8EE',
}

const W = 1190   // natural width  (px)
const H = 842    // natural height (px)

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** The entire certificate rendered as a 1190×842 SVG foreignObject + HTML mix.
 *  We use a plain <div> wrapper + absolute-positioned children for flexibility. */
function CertBody({ recipientName, departmentName, certificateId, issueDate, verificationUrl }) {
  return (
    <div
      style={{
        width: W,
        height: H,
        position: 'relative',
        background: C.navy,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        overflow: 'hidden',
        borderRadius: 4,
      }}
    >
      {/* ── Background gradient overlay ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 0%, ${C.navyMid} 0%, ${C.navy} 70%)`,
      }} />

      {/* ── Outer gold border ── */}
      <div style={{
        position: 'absolute', inset: 14,
        border: `2px solid ${C.gold}`,
        borderRadius: 4,
        pointerEvents: 'none',
      }} />

      {/* ── Inner thin gold border ── */}
      <div style={{
        position: 'absolute', inset: 20,
        border: `1px solid ${C.goldLight}40`,
        borderRadius: 3,
        pointerEvents: 'none',
      }} />

      {/* ── Decorative corner ornaments (SVG) ── */}
      <svg style={{ position: 'absolute', inset: 0, width: W, height: H }} viewBox={`0 0 ${W} ${H}`}>
        {/* Top-left */}
        <g transform="translate(22,22)" stroke={C.gold} fill="none" strokeWidth="1.5">
          <line x1="0" y1="40" x2="0" y2="0" /><line x1="0" y1="0" x2="40" y2="0" />
          <circle cx="8" cy="8" r="3" fill={C.gold} stroke="none" />
        </g>
        {/* Top-right */}
        <g transform={`translate(${W-22},22) scale(-1,1)`} stroke={C.gold} fill="none" strokeWidth="1.5">
          <line x1="0" y1="40" x2="0" y2="0" /><line x1="0" y1="0" x2="40" y2="0" />
          <circle cx="8" cy="8" r="3" fill={C.gold} stroke="none" />
        </g>
        {/* Bottom-left */}
        <g transform={`translate(22,${H-22}) scale(1,-1)`} stroke={C.gold} fill="none" strokeWidth="1.5">
          <line x1="0" y1="40" x2="0" y2="0" /><line x1="0" y1="0" x2="40" y2="0" />
          <circle cx="8" cy="8" r="3" fill={C.gold} stroke="none" />
        </g>
        {/* Bottom-right */}
        <g transform={`translate(${W-22},${H-22}) scale(-1,-1)`} stroke={C.gold} fill="none" strokeWidth="1.5">
          <line x1="0" y1="40" x2="0" y2="0" /><line x1="0" y1="0" x2="40" y2="0" />
          <circle cx="8" cy="8" r="3" fill={C.gold} stroke="none" />
        </g>

        {/* Top centre gold bar */}
        <rect x={W/2-120} y="14" width="240" height="12" rx="6" fill={C.gold} />

        {/* Gold wave lines flanking the centre bar */}
        {[-1,1].map(dir => (
          <g key={dir} transform={`translate(${W/2 + dir*140},20)`}>
            <line x1="0" y1="0" x2={dir*60} y2="0" stroke={C.gold} strokeWidth="1" opacity="0.5" />
          </g>
        ))}
      </svg>

      {/* ── Left panel (dark) with CR badge area ── */}
      <div style={{
        position: 'absolute', left: 0, top: 0, width: 200, height: H,
        background: `linear-gradient(180deg, ${C.navyMid} 0%, ${C.navy}CC 100%)`,
        borderRight: `1px solid ${C.gold}50`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 16, padding: '20px 10px',
      }}>
        {/* CR circular badge */}
        <div style={{
          width: 90, height: 90,
          borderRadius: '50%',
          border: `3px solid ${C.gold}`,
          background: `radial-gradient(circle, ${C.navyMid}, ${C.navy})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column',
          boxShadow: `0 0 20px ${C.gold}40`,
        }}>
          <span style={{ color: C.gold, fontSize: 28, fontWeight: 700, lineHeight: 1, fontFamily: 'Georgia, serif' }}>CR</span>
          <span style={{ color: C.goldLight, fontSize: 9, letterSpacing: 2, marginTop: 2 }}>VERIFIED</span>
        </div>

        {/* Vertical text */}
        <div style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          transform: 'rotate(180deg)',
          color: C.goldPale,
          fontSize: 9,
          letterSpacing: 3,
          textTransform: 'uppercase',
          opacity: 0.7,
        }}>
          Career Radar
        </div>

        {/* QR / verify info */}
        {verificationUrl && (
          <div style={{
            marginTop: 'auto', textAlign: 'center',
            color: C.goldLight, fontSize: 8, opacity: 0.6, wordBreak: 'break-all',
            padding: '0 8px',
          }}>
            Verify at<br />
            <span style={{ fontFamily: 'monospace', fontSize: 7 }}>
              {verificationUrl.replace('https://', '')}
            </span>
          </div>
        )}
      </div>

      {/* ── Main content area ── */}
      <div style={{
        position: 'absolute', left: 200, right: 0, top: 0, bottom: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 60px 30px 50px',
        textAlign: 'center',
      }}>

        {/* Career Radar wordmark */}
        <div style={{
          fontSize: 13, letterSpacing: 8, textTransform: 'uppercase',
          color: C.goldLight, fontFamily: 'Georgia, serif', marginBottom: 6,
        }}>
          Career Radar
        </div>

        {/* Title */}
        <div style={{
          fontSize: 34, fontWeight: 700, letterSpacing: 2,
          color: C.white, fontFamily: 'Georgia, serif', lineHeight: 1.1,
          marginBottom: 4,
        }}>
          Certificate
        </div>
        <div style={{
          fontSize: 16, letterSpacing: 6, textTransform: 'uppercase',
          color: C.gold, marginBottom: 28,
        }}>
          of Appreciation
        </div>

        {/* Gold divider */}
        <div style={{ width: '60%', height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, marginBottom: 22 }} />

        {/* Intro text */}
        <div style={{ color: C.goldPale, fontSize: 12, letterSpacing: 1, marginBottom: 14, opacity: 0.85 }}>
          This certificate is proudly awarded to
        </div>

        {/* Recipient name */}
        <div style={{
          fontSize: 42, fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
          color: C.goldLight, lineHeight: 1.2, marginBottom: 6,
          textShadow: `0 2px 12px ${C.gold}60`,
        }}>
          {recipientName || 'Recipient Name'}
        </div>

        {/* Department */}
        {departmentName && (
          <div style={{
            color: C.goldPale, fontSize: 12, letterSpacing: 1,
            marginBottom: 16, opacity: 0.8, fontStyle: 'italic',
          }}>
            {departmentName}
          </div>
        )}

        {/* Body text */}
        <div style={{
          color: C.goldPale, fontSize: 11.5, lineHeight: 1.7,
          maxWidth: 480, marginBottom: 24, opacity: 0.8,
        }}>
          In recognition of outstanding dedication, hard work, and invaluable contributions
          to Career Radar's mission of empowering careers and transforming futures.
        </div>

        {/* Gold divider */}
        <div style={{ width: '50%', height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}80, transparent)`, marginBottom: 20 }} />

        {/* Bottom meta row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          width: '100%', paddingTop: 4,
        }}>
          {/* Signature block */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              height: 1, background: C.gold, width: 120, margin: '0 auto 4px',
            }} />
            <div style={{ color: C.goldPale, fontSize: 9, letterSpacing: 1, opacity: 0.7 }}>
              AUTHORISED SIGNATURE
            </div>
          </div>

          {/* Cert ID + date */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            {certificateId && (
              <div style={{ color: C.goldPale, fontSize: 9, fontFamily: 'monospace', opacity: 0.7, marginBottom: 2 }}>
                {certificateId}
              </div>
            )}
            {issueDate && (
              <div style={{ color: C.goldPale, fontSize: 9, opacity: 0.6 }}>
                {fmt(issueDate)}
              </div>
            )}
          </div>

          {/* Official seal placeholder */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              border: `2px solid ${C.gold}70`,
              margin: '0 auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: C.gold, fontSize: 9, letterSpacing: 1, textAlign: 'center', lineHeight: 1.3 }}>
                OFFICIAL<br/>SEAL
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function CertificateAppreciationPreview({
  certificateId   = 'CR-VOL-2026-001',
  recipientName   = 'Recipient Name',
  departmentName  = 'Department / Team',
  issueDate,
  verificationUrl = 'https://www.career-radar.space/verify/preview',
  className       = '',
  showShadow      = true,
}) {
  const wrapRef = useRef(null)
  const [scale, setScale] = useState(0.4)

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => {
      const avail = el.clientWidth
      if (avail > 0) setScale(Math.min(avail / W, 1))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ width: '100%', overflow: 'hidden', borderRadius: 6 }}
    >
      <div
        style={{
          width: W * scale,
          height: H * scale,
          position: 'relative',
          ...(showShadow ? { boxShadow: '0 8px 32px rgba(0,0,0,0.4)' } : {}),
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        <div style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: W,
          height: H,
        }}>
          <CertBody
            recipientName={recipientName}
            departmentName={departmentName}
            certificateId={certificateId}
            issueDate={issueDate}
            verificationUrl={verificationUrl}
          />
        </div>
      </div>
    </div>
  )
}
