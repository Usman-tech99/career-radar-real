/**
 * CertificateAppreciationPreview
 *
 * Browser-side preview that matches the official Career Radar
 * "Certificate of Appreciation" design exactly.
 *
 * Layout mirrors the PDF renderer in certificateHtml.js:
 *   - Left navy panel  (~29% width): CR logo circle, gold diagonal shapes,
 *     gold hexagon star badge, three feature bullet points
 *   - Right white panel (~71% width): CERTIFICATE heading, recipient name
 *     in script, body text, signature block, date
 *
 * Uses CSS scale-to-fit so it fills any container width.
 */

import { useLayoutEffect, useRef, useState } from 'react'
import logo from '../../assets/logo.jpeg'

// ── Canvas dimensions (A4 landscape @ 96 dpi) ─────────────────────────────────
const W = 1122
const H = 794
const LEFT_W = 328   // ~29.2% — matches official left panel

// ── Design tokens ──────────────────────────────────────────────────────────────
const NAVY   = '#0D1B3E'
const GOLD   = '#C9A227'
const GOLD2  = '#E8C547'
const WHITE  = '#FFFFFF'
const OFFWHT = '#F8F9FA'

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(str) {
  if (!str) return { d: '__', m: '__', y: '____' }
  const dt = new Date(str + 'T12:00:00')
  return {
    d: String(dt.getDate()).padStart(2, '0'),
    m: String(dt.getMonth() + 1).padStart(2, '0'),
    y: String(dt.getFullYear()),
  }
}

// ── Left panel gold diagonal shapes (SVG) ─────────────────────────────────────
function LeftPanelShapes() {
  return (
    <svg
      viewBox={`0 0 ${LEFT_W} ${H}`}
      style={{ position: 'absolute', inset: 0, width: LEFT_W, height: H }}
      preserveAspectRatio="none"
    >
      {/* Large gold diagonal blade — right edge of panel going to top-right */}
      <polygon
        points={`${LEFT_W - 46},0 ${LEFT_W + 2},0 ${LEFT_W + 2},${H} ${LEFT_W - 66},${H}`}
        fill={GOLD}
        opacity="0.92"
      />
      {/* Thinner gold accent stripe just inside it */}
      <polygon
        points={`${LEFT_W - 66},0 ${LEFT_W - 46},0 ${LEFT_W - 66},${H} ${LEFT_W - 86},${H}`}
        fill={GOLD2}
        opacity="0.45"
      />
      {/* Bottom-left corner triangle accent */}
      <polygon
        points={`0,${H} 0,${H * 0.7} ${LEFT_W * 0.55},${H}`}
        fill={GOLD}
        opacity="0.18"
      />
    </svg>
  )
}

// ── Gold hexagon star badge ────────────────────────────────────────────────────
function HexBadge() {
  const cx = 40, cy = 44, r = 38
  // Regular hexagon points (flat-top)
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30)
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
  }).join(' ')
  const ptsInner = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30)
    return `${cx + (r - 5) * Math.cos(a)},${cy + (r - 5) * Math.sin(a)}`
  }).join(' ')

  return (
    <svg width="80" height="88" viewBox="0 0 80 88">
      <defs>
        <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={GOLD} />
          <stop offset="50%" stopColor={GOLD2} />
          <stop offset="100%" stopColor={GOLD} />
        </linearGradient>
      </defs>
      <polygon points={pts} fill="url(#hexGrad)" />
      <polygon points={ptsInner} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      {/* Star ★ */}
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize="34" fill={WHITE} style={{ fontFamily: 'Georgia, serif' }}>★</text>
    </svg>
  )
}

// ── Feature bullet items ───────────────────────────────────────────────────────
const FEATURES = [
  { emoji: '🎯', label: 'Find Opportunities' },
  { emoji: '📖', label: 'Prepare Yourself' },
  { emoji: '🏆', label: 'Succeed Globally' },
]

// ── Signature SVG (cursive "Hasnain") ─────────────────────────────────────────
function SignatureSvg() {
  return (
    <svg width="180" height="52" viewBox="0 0 180 52" style={{ display: 'block' }}>
      <text
        x="14" y="40"
        fontFamily="'Brush Script MT', 'Dancing Script', cursive"
        fontSize="38"
        fill={NAVY}
        opacity="0.85"
      >
        Hasnain
      </text>
    </svg>
  )
}

// ── Watermark concentric circles ──────────────────────────────────────────────
function Watermark() {
  return (
    <svg
      style={{ position: 'absolute', right: -30, top: '50%', transform: 'translateY(-50%)', opacity: 0.12 }}
      width="340" height="340" viewBox="0 0 340 340"
    >
      <circle cx="170" cy="170" r="155" fill="none" stroke={NAVY} strokeWidth="34" />
      <circle cx="170" cy="170" r="100" fill="none" stroke={NAVY} strokeWidth="14" />
      <circle cx="170" cy="170" r="56"  fill="none" stroke={NAVY} strokeWidth="8" />
    </svg>
  )
}

// ── Main certificate body ──────────────────────────────────────────────────────
function CertBody({ certificateId, recipientName, departmentName, issueDate }) {
  const { d, m, y } = fmtDate(issueDate)

  return (
    <div style={{
      width: W, height: H,
      display: 'flex', flexDirection: 'row',
      fontFamily: "'Arial', sans-serif",
      background: WHITE,
      overflow: 'hidden',
    }}>

      {/* ══ LEFT NAVY PANEL ══ */}
      <div style={{
        width: LEFT_W, height: H,
        background: NAVY,
        position: 'relative',
        flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        padding: '28px 16px 24px',
        gap: 0,
        zIndex: 0,
      }}>
        <LeftPanelShapes />

        {/* Career Radar circular logo */}
        <div style={{
          position: 'relative', zIndex: 2,
          width: 148, height: 148,
          borderRadius: '50%',
          border: `4px solid ${GOLD}`,
          background: WHITE,
          overflow: 'hidden',
          boxShadow: `0 4px 24px rgba(0,0,0,0.35)`,
          flexShrink: 0,
        }}>
          <img
            src={logo}
            alt="Career Radar"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Brand text below logo */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', marginTop: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: 0.5 }}>
            <span style={{ color: WHITE }}>Career</span>
            <span style={{ color: GOLD }}>Radar</span>
          </div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.65)', letterSpacing: 1.8, textTransform: 'uppercase', marginTop: 3 }}>
            — Your Opportunity Scanner —
          </div>
          <div style={{ color: GOLD, fontSize: 10, marginTop: 3 }}>★</div>
          <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>
            Find. Prepare. Succeed.
          </div>
        </div>

        {/* Gold hexagon star badge */}
        <div style={{ position: 'relative', zIndex: 2, marginTop: 28 }}>
          <HexBadge />
        </div>

        {/* Feature bullet list */}
        <div style={{
          position: 'relative', zIndex: 2,
          marginTop: 'auto', width: '100%',
          display: 'flex', flexDirection: 'column', gap: 11,
        }}>
          {FEATURES.map(({ emoji, label }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 11.5, color: 'rgba(255,255,255,0.88)',
            }}>
              <span style={{ fontSize: 15 }}>{emoji}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ RIGHT WHITE PANEL ══ */}
      <div style={{
        flex: 1, height: H,
        background: WHITE,
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        padding: '18px 38px 20px 44px',
        overflow: 'hidden',
      }}>
        <Watermark />

        {/* Certificate ID — top right */}
        <div style={{
          position: 'absolute', top: 16, right: 30,
          fontSize: 10, color: '#64748B', letterSpacing: 0.8,
          fontFamily: 'monospace',
        }}>
          {certificateId || 'CR-VOL-2026-___'}
        </div>

        {/* ── Heading ── */}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: 58, fontWeight: 900, color: NAVY,
            fontFamily: "'Arial Black', 'Arial', sans-serif",
            letterSpacing: 6, lineHeight: 1, marginTop: 8,
          }}>
            CERTIFICATE
          </div>
          <div style={{
            fontSize: 16, fontWeight: 700, color: GOLD,
            letterSpacing: 8, textTransform: 'uppercase',
            marginTop: 2,
          }}>
            OF APPRECIATION
          </div>
          <div style={{ color: GOLD, fontSize: 20, marginTop: 3 }}>★</div>
        </div>

        {/* ── Proudly presented to ── */}
        <div style={{
          textAlign: 'center', marginTop: 10,
          fontSize: 10, letterSpacing: 4, color: '#64748B',
          fontWeight: 700, textTransform: 'uppercase',
          position: 'relative', zIndex: 1,
        }}>
          PROUDLY PRESENTED TO
        </div>

        {/* ── Recipient name with flanking gold rules ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          margin: '8px 0 4px',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{ flex: 1, height: 1.5, background: `linear-gradient(to right, transparent, ${GOLD})` }} />
          <div style={{
            fontSize: 50,
            fontFamily: "'Brush Script MT', 'Dancing Script', 'Segoe Script', cursive",
            color: NAVY,
            fontStyle: 'italic',
            whiteSpace: 'nowrap',
            lineHeight: 1.15,
          }}>
            {recipientName || 'Recipient Name'}
          </div>
          <div style={{ flex: 1, height: 1.5, background: `linear-gradient(to left, transparent, ${GOLD})` }} />
        </div>

        {/* ── Body text ── */}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, flex: 1 }}>
          {/* Recognition line */}
          <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.65, marginBottom: 8 }}>
            in recognition of your valuable contributions as a volunteer in the{' '}
            <strong style={{ color: GOLD }}>
              [{departmentName || 'DEPARTMENT / TEAM NAME'}]
            </strong>{' '}
            at <strong style={{ color: NAVY }}>Career Radar.</strong>
          </div>

          {/* Dedication paragraph */}
          <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.75, marginBottom: 6 }}>
            Your dedication, professionalism, and commitment<br />
            have played an important role in supporting our mission of helping<br />
            students and early-career professionals discover opportunities,<br />
            develop skills, and build successful careers.
          </div>

          {/* Appreciation sentence */}
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', marginBottom: 5, lineHeight: 1.5 }}>
            We sincerely appreciate your time, effort, and positive<br />
            impact on our community.
          </div>

          {/* Thank you */}
          <div style={{
            fontSize: 13, fontStyle: 'italic', color: GOLD,
            fontFamily: 'Georgia, serif',
          }}>
            Thank you for being an essential part of Career Radar!
          </div>
        </div>

        {/* ── Footer: signature left | date right ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', position: 'relative', zIndex: 1,
          marginTop: 10,
        }}>
          {/* Signature block */}
          <div style={{ textAlign: 'center' }}>
            <SignatureSvg />
            {/* Rule under signature */}
            <div style={{ height: 1, background: NAVY, opacity: 0.2, width: 180, margin: '2px auto 6px' }} />
            <div style={{ fontSize: 10.5, fontWeight: 700, color: NAVY, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Hasnain Shakeel Ahmed
            </div>
            <div style={{ fontSize: 9.5, color: GOLD, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 2 }}>
              Founder &amp; CEO
            </div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: NAVY, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 1 }}>
              Career Radar
            </div>
          </div>

          {/* Date block */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: GOLD,
              letterSpacing: 2, textTransform: 'uppercase', marginBottom: 5,
            }}>
              DATE
            </div>
            <div style={{
              fontSize: 12, color: NAVY,
              borderBottom: `1.5px solid ${NAVY}`,
              paddingBottom: 3, minWidth: 110, opacity: 0.75,
              textAlign: 'center',
            }}>
              {d} / {m} / {y}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Scale-to-fit wrapper ───────────────────────────────────────────────────────
export default function CertificateAppreciationPreview({
  certificateId   = 'CR-VOL-2026-001',
  recipientName   = 'Recipient Name',
  departmentName  = 'Department / Team',
  issueDate,
  verificationUrl,  // kept for API compat; not shown in preview (shown on PDF)
  className = '',
  showShadow = true,
}) {
  const wrapRef = useRef(null)
  const [scale, setScale] = useState(0.35)

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
      style={{ width: '100%' }}
    >
      <div style={{
        width: Math.round(W * scale),
        height: Math.round(H * scale),
        position: 'relative',
        borderRadius: 4,
        overflow: 'hidden',
        ...(showShadow ? { boxShadow: '0 8px 40px rgba(0,0,0,0.35)' } : {}),
      }}>
        <div style={{
          width: W,
          height: H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}>
          <CertBody
            certificateId={certificateId}
            recipientName={recipientName}
            departmentName={departmentName}
            issueDate={issueDate}
          />
        </div>
      </div>
    </div>
  )
}
