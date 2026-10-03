/**
 * CertificateAppreciationPreview
 *
 * Official Career Radar "Certificate of Appreciation" component.
 * Recreates the exact client design from image reference:
 *   - Left Navy Panel (~29.2% width):
 *       • Career Radar circular medallion with double gold ring
 *       • Angled gold ribbon tails below medallion
 *       • Navy hexagon badge with double gold border & gold star
 *       • 3 Feature bullets: Find Opportunities, Prepare Yourself, Succeed Globally
 *   - Right Off-White Panel (~70.8% width):
 *       • Top-right: Certificate reference (e.g. CR-VOL-2026-___)
 *       • CERTIFICATE (navy bold) / OF APPRECIATION (gold spaced) / ★ with gold rules
 *       • PROUDLY PRESENTED TO
 *       • Recipient Name in elegant cursive script with flanking gold rules
 *       • Recognition body with gold bold [DEPARTMENT / TEAM NAME]
 *       • Core appreciation statement & gold italic closing
 *       • Hasnain Shakeel Ahmed (Founder & CEO) signature block
 *       • Bottom-right corner navy triangle with gold blade border for DATE
 */

import { useLayoutEffect, useRef, useState } from 'react'
import logo from '../../assets/logo.jpeg'

const W = 1122
const H = 794
const LEFT_W = 328

const NAVY = '#0B1B3D'
const NAVY_DEEP = '#07122A'
const GOLD = '#C9993C'
const GOLD_LIGHT = '#E5C46E'
const GOLD_ACCENT = '#D4A017'
const WHITE = '#FFFFFF'

function fmtDate(str) {
  if (!str) return { d: '__', m: '__', y: '____' }
  try {
    const dt = new Date(str.includes('T') ? str : str + 'T12:00:00')
    if (isNaN(dt.getTime())) return { d: '__', m: '__', y: '____' }
    return {
      d: String(dt.getDate()).padStart(2, '0'),
      m: String(dt.getMonth() + 1).padStart(2, '0'),
      y: String(dt.getFullYear()),
    }
  } catch {
    return { d: '__', m: '__', y: '____' }
  }
}

// ── Left panel decorative gold blades ──────────────────────────────────────────
function LeftPanelBlades() {
  return (
    <svg
      viewBox={`0 0 ${LEFT_W} ${H}`}
      style={{ position: 'absolute', inset: 0, width: LEFT_W, height: H, pointerEvents: 'none' }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="50%" stopColor={GOLD} />
          <stop offset="100%" stopColor="#9B6E1F" />
        </linearGradient>
        <linearGradient id="bladeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={GOLD_LIGHT} stopOpacity="0.4" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Main sharp gold diagonal blade on right edge */}
      <polygon
        points={`${LEFT_W - 55},0 ${LEFT_W + 2},0 ${LEFT_W + 2},${H} ${LEFT_W - 75},${H}`}
        fill="url(#bladeGrad)"
      />
      {/* Secondary accent diagonal stripe */}
      <polygon
        points={`${LEFT_W - 75},0 ${LEFT_W - 55},0 ${LEFT_W - 75},${H} ${LEFT_W - 95},${H}`}
        fill="url(#bladeGrad2)"
      />
      {/* Bottom angled corner accent */}
      <polygon
        points={`0,${H} 0,${H * 0.72} ${LEFT_W * 0.6},${H}`}
        fill={GOLD}
        opacity="0.12"
      />
    </svg>
  )
}

// ── Bottom right corner navy triangle with gold blade ──────────────────────────
function BottomRightDateCorner({ dateStr }) {
  const { d, m, y } = fmtDate(dateStr)
  const TRI_W = 210
  const TRI_H = 170

  return (
    <div style={{
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: TRI_W,
      height: TRI_H,
      pointerEvents: 'none',
      zIndex: 2,
    }}>
      <svg
        viewBox={`0 0 ${TRI_W} ${TRI_H}`}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
      >
        <defs>
          <linearGradient id="dateBladeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9B6E1F" />
            <stop offset="50%" stopColor={GOLD} />
            <stop offset="100%" stopColor={GOLD_LIGHT} />
          </linearGradient>
        </defs>

        {/* Gold diagonal border blade */}
        <polygon
          points={`0,${TRI_H} ${TRI_W},0 ${TRI_W},16 16,${TRI_H}`}
          fill="url(#dateBladeGrad)"
        />
        {/* Navy corner triangle */}
        <polygon
          points={`14,${TRI_H} ${TRI_W},14 ${TRI_W},${TRI_H}`}
          fill={NAVY}
        />
      </svg>

      {/* Date text content inside navy triangle */}
      <div style={{
        position: 'absolute',
        right: 28,
        bottom: 24,
        textAlign: 'center',
        zIndex: 3,
      }}>
        <div style={{
          fontSize: 12,
          fontWeight: 700,
          color: GOLD,
          letterSpacing: 2.5,
          textTransform: 'uppercase',
          marginBottom: 6,
          fontFamily: "'Arial', sans-serif",
        }}>
          DATE
        </div>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: WHITE,
          borderBottom: `1.5px solid ${GOLD}`,
          paddingBottom: 4,
          minWidth: 85,
          letterSpacing: 1.5,
          fontFamily: "'Arial', sans-serif",
        }}>
          {d} / {m} / {y}
        </div>
      </div>
    </div>
  )
}

// ── Medallion Ribbon Tails ─────────────────────────────────────────────────────
function RibbonTails() {
  return (
    <svg
      width="110"
      height="65"
      viewBox="0 0 110 65"
      style={{
        position: 'relative',
        marginTop: -28,
        zIndex: 1,
      }}
    >
      <defs>
        <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="60%" stopColor={GOLD} />
          <stop offset="100%" stopColor="#8C6215" />
        </linearGradient>
      </defs>
      {/* Left ribbon tail */}
      <polygon
        points="22,0 48,0 42,60 28,48 14,60"
        fill="url(#ribbonGrad)"
        opacity="0.95"
      />
      {/* Right ribbon tail */}
      <polygon
        points="62,0 88,0 96,60 82,48 68,60"
        fill="url(#ribbonGrad)"
        opacity="0.95"
      />
    </svg>
  )
}

// ── Gold Hexagon Badge with Star ───────────────────────────────────────────────
function HexBadge() {
  const cx = 46, cy = 50, r = 42
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30)
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
  }).join(' ')

  const ptsInner = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30)
    return `${cx + (r - 5) * Math.cos(a)},${cy + (r - 5) * Math.sin(a)}`
  }).join(' ')

  return (
    <svg width="92" height="100" viewBox="0 0 92 100">
      <defs>
        <linearGradient id="hexGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="50%" stopColor={GOLD} />
          <stop offset="100%" stopColor="#8C6215" />
        </linearGradient>
      </defs>
      {/* Outer gold border */}
      <polygon points={pts} fill="url(#hexGold)" />
      {/* Inner navy background */}
      <polygon points={ptsInner} fill={NAVY_DEEP} />
      {/* Gold star */}
      <text
        x={cx}
        y={cy + 13}
        textAnchor="middle"
        fontSize="34"
        fill="url(#hexGold)"
        style={{ fontFamily: 'Georgia, serif', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
      >
        ★
      </text>
    </svg>
  )
}

// ── Background Watermark (Target Radar & Briefcase) ───────────────────────────
function Watermark() {
  return (
    <svg
      style={{
        position: 'absolute',
        right: 40,
        top: '52%',
        transform: 'translateY(-50%)',
        opacity: 0.045,
        pointerEvents: 'none',
      }}
      width="440"
      height="440"
      viewBox="0 0 440 440"
    >
      {/* Concentric radar circles */}
      <circle cx="220" cy="220" r="200" fill="none" stroke={NAVY} strokeWidth="26" />
      <circle cx="220" cy="220" r="140" fill="none" stroke={NAVY} strokeWidth="18" />
      <circle cx="220" cy="220" r="80"  fill="none" stroke={NAVY} strokeWidth="12" />
      {/* Target Arrow line */}
      <line x1="60" y1="380" x2="380" y2="60" stroke={NAVY} strokeWidth="16" strokeLinecap="round" />
      <polygon points="380,60 330,70 370,110" fill={NAVY} />
    </svg>
  )
}

// ── Features in Left Panel ─────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD_LIGHT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    label: 'Find Opportunities',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD_LIGHT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
        <path d="M6 6h10" />
        <path d="M6 10h10" />
      </svg>
    ),
    label: 'Prepare Yourself',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD_LIGHT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
        <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
    label: 'Succeed Globally',
  },
]

// ── Main Certificate Canvas ────────────────────────────────────────────────────
function CertificateCanvas({ certificateId, recipientName, departmentName, issueDate }) {
  return (
    <div style={{
      width: W,
      height: H,
      display: 'flex',
      flexDirection: 'row',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      background: '#FAFAFC',
      position: 'relative',
      overflow: 'hidden',
      color: '#1E293B',
    }}>

      {/* ══════════════ LEFT NAVY PANEL ══════════════ */}
      <div style={{
        width: LEFT_W,
        height: H,
        background: `linear-gradient(175deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
        position: 'relative',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 18px 28px',
        zIndex: 1,
      }}>
        <LeftPanelBlades />

        {/* Circular Medallion */}
        <div style={{
          position: 'relative',
          zIndex: 3,
          width: 160,
          height: 160,
          borderRadius: '50%',
          border: `5px solid ${GOLD}`,
          background: WHITE,
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5), inset 0 0 0 3px #0B1B3D',
          flexShrink: 0,
        }}>
          <img
            src={logo}
            alt="Career Radar Logo"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Ribbon tails below medallion */}
        <RibbonTails />

        {/* Hexagon Star Badge */}
        <div style={{ position: 'relative', zIndex: 3, marginTop: 16 }}>
          <HexBadge />
        </div>

        {/* 3 Features at bottom */}
        <div style={{
          position: 'relative',
          zIndex: 3,
          marginTop: 'auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 13,
          paddingLeft: 14,
        }}>
          {FEATURES.map(({ icon, label }) => (
            <div key={label} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 12,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.92)',
              letterSpacing: 0.3,
            }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════ RIGHT WHITE PANEL ══════════════ */}
      <div style={{
        flex: 1,
        height: H,
        background: WHITE,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 44px 24px 50px',
        overflow: 'hidden',
        zIndex: 1,
      }}>
        <Watermark />
        <BottomRightDateCorner dateStr={issueDate} />

        {/* Top-Right Certificate ID */}
        <div style={{
          position: 'absolute',
          top: 20,
          right: 36,
          fontSize: 11,
          fontWeight: 600,
          color: '#64748B',
          letterSpacing: 1,
          fontFamily: "'Courier New', Courier, monospace",
        }}>
          {certificateId || 'CR-VOL-2026-___'}
        </div>

        {/* ── Main Heading ── */}
        <div style={{ textAlign: 'center', marginTop: 12, position: 'relative', zIndex: 2 }}>
          <div style={{
            fontSize: 54,
            fontWeight: 900,
            color: NAVY,
            letterSpacing: 8,
            lineHeight: 1,
            fontFamily: "'Arial Black', 'Inter', sans-serif",
          }}>
            CERTIFICATE
          </div>
          <div style={{
            fontSize: 17,
            fontWeight: 700,
            color: GOLD,
            letterSpacing: 9,
            textTransform: 'uppercase',
            marginTop: 4,
            fontFamily: "'Inter', sans-serif",
          }}>
            OF APPRECIATION
          </div>

          {/* Star with flanking horizontal rules */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            width: 260,
            margin: '6px auto 0',
          }}>
            <div style={{ flex: 1, height: 1.5, background: `linear-gradient(to right, transparent, ${GOLD})` }} />
            <span style={{ color: GOLD, fontSize: 18, lineHeight: 1 }}>★</span>
            <div style={{ flex: 1, height: 1.5, background: `linear-gradient(to left, transparent, ${GOLD})` }} />
          </div>
        </div>

        {/* ── Proudly Presented To ── */}
        <div style={{
          textAlign: 'center',
          marginTop: 14,
          fontSize: 10.5,
          letterSpacing: 4.5,
          color: '#64748B',
          fontWeight: 700,
          textTransform: 'uppercase',
          position: 'relative',
          zIndex: 2,
        }}>
          PROUDLY PRESENTED TO
        </div>

        {/* ── Recipient Name with flanking gold rules ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          margin: '10px 0 6px',
          position: 'relative',
          zIndex: 2,
        }}>
          <div style={{ width: 60, height: 1.5, background: `linear-gradient(to right, transparent, ${GOLD})` }} />
          <div style={{
            fontSize: 48,
            fontFamily: "'Great Vibes', 'Alex Brush', 'Brush Script MT', 'Dancing Script', 'Segoe Script', cursive",
            color: NAVY,
            fontStyle: 'italic',
            whiteSpace: 'nowrap',
            lineHeight: 1.15,
            padding: '0 8px',
          }}>
            {recipientName || 'Recipient Name'}
          </div>
          <div style={{ width: 60, height: 1.5, background: `linear-gradient(to left, transparent, ${GOLD})` }} />
        </div>

        {/* ── Certificate Body Content ── */}
        <div style={{
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
          maxWidth: 620,
          margin: '0 auto',
          flex: 1,
        }}>
          {/* Recognition Line */}
          <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, marginBottom: 10 }}>
            in recognition of your valuable contributions as a volunteer in the{' '}
            <strong style={{ color: GOLD_ACCENT, fontWeight: 700 }}>
              [{departmentName || 'DEPARTMENT / TEAM NAME'}]
            </strong>{' '}
            at <strong style={{ color: NAVY, fontWeight: 700 }}>Career Radar.</strong>
          </div>

          {/* Dedication Text */}
          <div style={{ fontSize: 11.5, color: '#64748B', lineHeight: 1.7, marginBottom: 8 }}>
            Your dedication, professionalism, and commitment have played an important role in supporting our mission of helping students and early-career professionals discover opportunities, develop skills, and build successful careers.
          </div>

          {/* Appreciation Highlight */}
          <div style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: '#1E293B',
            marginBottom: 6,
            lineHeight: 1.5,
          }}>
            We sincerely appreciate your time, effort, and positive impact on our community.
          </div>

          {/* Gold Italic Thank You */}
          <div style={{
            fontSize: 13.5,
            fontStyle: 'italic',
            color: GOLD_ACCENT,
            fontFamily: "'Georgia', serif",
            marginTop: 4,
          }}>
            Thank you for being an essential part of Career Radar!
          </div>
        </div>

        {/* ── Signature Block (Centered left of date corner) ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          position: 'relative',
          zIndex: 2,
          paddingRight: 100, // offset from date corner
          paddingBottom: 8,
        }}>
          <div style={{ textAlign: 'center' }}>
            {/* Cursive Signature Hasnain */}
            <div style={{
              fontFamily: "'Brush Script MT', 'Great Vibes', 'Dancing Script', cursive",
              fontSize: 36,
              color: NAVY,
              lineHeight: 1,
              marginBottom: -4,
              opacity: 0.9,
            }}>
              Hasnain
            </div>
            {/* Signature Underline */}
            <div style={{ height: 1.5, background: NAVY, opacity: 0.25, width: 190, margin: '2px auto 6px' }} />
            <div style={{
              fontSize: 11,
              fontWeight: 800,
              color: NAVY,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}>
              HASNAIN SHAKEEL AHMED
            </div>
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              color: GOLD,
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginTop: 2,
            }}>
              FOUNDER &amp; CEO
            </div>
            <div style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: NAVY,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginTop: 1,
            }}>
              CAREER RADAR
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Public Auto-Scaling Component ──────────────────────────────────────────────
export default function CertificateAppreciationPreview(props) {
  const wrapRef = useRef(null)
  const [scale, setScale] = useState(0.35)

  // Normalize props so both <CertificateAppreciationPreview ...> and <CertificatePreview values={...} ...> work
  const values = props.values || {}
  const certificateId =
    props.certificateId ||
    props.certificate_id ||
    values.certificate_id ||
    values.certificateId ||
    'CR-VOL-2026-001'

  const recipientName =
    props.recipientName ||
    props.recipient_name ||
    values.recipient_name ||
    values.recipientName ||
    'Recipient Name'

  const departmentName =
    props.departmentName ||
    props.department_name ||
    values.department_name ||
    values.departmentName ||
    values.custom_fields?.department_name ||
    'DEPARTMENT / TEAM NAME'

  const issueDate =
    props.issueDate ||
    props.issue_date ||
    values.issue_date ||
    values.issueDate

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
      className={props.className || ''}
      style={{ width: '100%', position: 'relative' }}
    >
      <div style={{
        width: Math.round(W * scale),
        height: Math.round(H * scale),
        position: 'relative',
        borderRadius: 6,
        overflow: 'hidden',
        boxShadow: props.showShadow !== false ? '0 12px 48px rgba(0,0,0,0.35)' : 'none',
      }}>
        <div style={{
          width: W,
          height: H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}>
          <CertificateCanvas
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
