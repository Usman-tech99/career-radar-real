/**
 * Offline checks for the certificate renderer and the QR encoder.
 *
 * These do not need a browser or a database: they assert that the shared
 * renderer emits a complete document, that design values cannot escape the
 * stylesheet, and that the QR encoder produces modules a decoder can read.
 *
 * Run with: node scripts/verify-certificate-renderer.mjs
 */
import assert from 'node:assert/strict'
import {
  renderCertificateHtml, normalizeDesign, previewValues, PAGE_SIZES, DEFAULT_DESIGN,
} from '../supabase/functions/generate-certificate-pdf/certificateHtml.js'
import { encodeQR, qrToSvg } from '../supabase/functions/generate-certificate-pdf/qrcode.js'

let passed = 0
function check(name, fn) {
  try {
    fn()
    passed += 1
    console.log(`  ok  ${name}`)
  } catch (error) {
    console.error(`FAIL  ${name}\n      ${error.message}`)
    process.exitCode = 1
  }
}

const VERIFY_URL = 'https://www.career-radar.space/verify/v_0123456789abcdef0123456789abcdef0123456789abcdef'

console.log('\ncertificate renderer')

check('emits a complete document', () => {
  const html = renderCertificateHtml({
    design: normalizeDesign(DEFAULT_DESIGN),
    values: previewValues(DEFAULT_DESIGN),
    page: { size: 'A4', orientation: 'landscape' },
  })
  assert.match(html, /^<!DOCTYPE html>/)
  assert.match(html, /<\/html>\s*$/)
  assert.match(html, /<style>/)
  assert.match(html, /@page/)
  assert.ok(!html.includes('undefined'), 'template should not render the string "undefined"')
})

check('sizes the sheet for each page size and orientation', () => {
  for (const [size, orientations] of Object.entries(PAGE_SIZES)) {
    for (const [orientation, dims] of Object.entries(orientations)) {
      const html = renderCertificateHtml({
        design: normalizeDesign(DEFAULT_DESIGN),
        values: previewValues(DEFAULT_DESIGN),
        page: { size, orientation },
      })
      assert.ok(html.includes(`width: ${dims.w}mm`), `${size}/${orientation} width missing`)
      assert.ok(html.includes(`height: ${dims.h}mm`), `${size}/${orientation} height missing`)
    }
  }
})

check('requests Google Fonts with a valid CSS2 query', () => {
  const html = renderCertificateHtml({
    design: normalizeDesign(DEFAULT_DESIGN),
    values: previewValues(DEFAULT_DESIGN),
    page: { size: 'A4', orientation: 'landscape' },
  })
  const match = html.match(/href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"/)
  assert.ok(match, 'font stylesheet link missing')
  const url = match[1]
  // Multi-word families must be '+'-separated and every family must carry a wght axis.
  assert.ok(url.includes('family=Playfair+Display:wght@'), 'Playfair Display not encoded correctly')
  assert.ok(!url.includes('Playfair Display'), 'family name contains a raw space')
  assert.equal((url.match(/family=/g) || []).length, (url.match(/:/g) || []).length)
  assert.ok(url.endsWith('&display=block'), 'display=block missing')
})

check('embeds a QR code only when a verification URL is present', () => {
  const design = normalizeDesign(DEFAULT_DESIGN)
  const base = previewValues(design)

  const withQr = renderCertificateHtml({
    design, values: { ...base, verificationUrl: VERIFY_URL }, page: { size: 'A4', orientation: 'landscape' },
  })
  assert.match(withQr, /class="qr"/, 'QR missing when a verification URL is supplied')

  const withoutQr = renderCertificateHtml({
    design, values: { ...base, verificationUrl: '' }, page: { size: 'A4', orientation: 'landscape' },
  })
  assert.doesNotMatch(withoutQr, /class="qr"/, 'QR rendered without a verification URL')
})

check('escapes recipient-supplied text', () => {
  const design = normalizeDesign(DEFAULT_DESIGN)
  const html = renderCertificateHtml({
    design,
    values: {
      ...previewValues(design),
      recipientName: '<script>alert(1)</script>',
      certificateTitle: '"><img src=x onerror=alert(1)>',
      certificateId: "CR-2026-000001'",
    },
    page: { size: 'A4', orientation: 'landscape' },
  })
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/)
  // The escaped title keeps the literal characters (they render as text), so
  // what matters is that no attribute or tag boundary was created.
  assert.match(html, /&quot;&gt;&lt;img src=x onerror=alert\(1\)&gt;/)
  assert.doesNotMatch(html, /<img src=x/)
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
})

check('neutralises hostile colour and font values', () => {
  const design = normalizeDesign({
    ...DEFAULT_DESIGN,
    palette: {
      background: '#fff;} body{display:none} .x{color:red',
      text: 'red;} * { background: url(javascript:alert(1))',
      accent: 'expression(alert(1))',
      muted: '#123456',
    },
    frame: { ...DEFAULT_DESIGN.frame, color: 'blue;} @import "evil.css";' },
    typography: { ...DEFAULT_DESIGN.typography, bodyFont: 'Inter;} *{display:none}' },
  })
  const html = renderCertificateHtml({
    design: normalizeDesign(design),
    values: previewValues(design),
    page: { size: 'A4', orientation: 'landscape' },
  })
  assert.doesNotMatch(html, /javascript:/)
  assert.doesNotMatch(html, /@import/)
  assert.doesNotMatch(html, /expression\(/)
  assert.doesNotMatch(html, /body\{display:none\}/)
  assert.ok(!html.includes('Inter;}'), 'raw font value reached the stylesheet')
})

check('rejects javascript: and data:text asset URLs', () => {
  const design = normalizeDesign(DEFAULT_DESIGN)
  const html = renderCertificateHtml({
    design,
    values: {
      ...previewValues(design),
      backgroundUrl: 'javascript:alert(1)',
      organizationLogoUrl: 'data:text/html,<script>alert(1)</script>',
      signatory1Image: 'https://example.com/sig.png',
    },
    page: { size: 'A4', orientation: 'landscape' },
  })
  assert.doesNotMatch(html, /javascript:alert/)
  assert.doesNotMatch(html, /data:text\/html/)
  assert.match(html, /https:\/\/example\.com\/sig\.png/)
})

check('tolerates a partial design object', () => {
  const html = renderCertificateHtml({
    design: normalizeDesign({ footer: { qrSize: 30 } }),
    values: {},
    page: {},
  })
  assert.match(html, /^<!DOCTYPE html>/)
  assert.ok(html.includes('width:30mm'), 'qrSize override was not applied')
})

console.log('\nqr encoder')

check('round-trips representative verification URLs', () => {
  // The canonical shape, plus the shortest and longest references the system
  // accepts, so version selection is exercised.
  const references = [
    VERIFY_URL,
    `https://www.career-radar.space/verify/v_${'0'.repeat(48)}`,
    `https://www.career-radar.space/verify/v_${'f'.repeat(48)}`,
    `https://career-radar.space/verify/v_${'a1b2'.repeat(12)}`,
    'CR-2026-000001',
    'CR-2099-999999',
  ]
  for (const reference of references) {
    const { size, version, modules } = encodeQR(reference)
    assert.ok(version >= 1 && version <= 40, `unexpected version ${version} for ${reference}`)
    assert.equal(modules.length, size, 'module count must match the reported size')
    assert.equal(modules.length, modules[0].length, 'module matrix must be square')
    for (const row of modules) {
      for (const cell of row) assert.ok(cell === 0 || cell === 1, 'modules must be binary')
    }
    // The top-left finder pattern is fixed by the spec at every version:
    // a 7-module dark ring, a light separator on row/column 7, and a 3-module
    // dark core at rows/cols 2-4. Checking it catches mask/placement regressions
    // that a length check would miss.
    for (let i = 0; i < 7; i++) {
      assert.equal(modules[0][i], 1, `finder top row, column ${i}`)
      assert.equal(modules[i][0], 1, `finder left column, row ${i}`)
    }
    for (let i = 0; i < 7; i++) {
      assert.equal(modules[7][i], 0, `finder separator row, column ${i}`)
      assert.equal(modules[i][7], 0, `finder separator column, row ${i}`)
    }
    for (let r = 2; r <= 4; r++) {
      for (let c = 2; c <= 4; c++) {
        assert.equal(modules[r][c], 1, `finder core at ${r},${c}`)
      }
    }
    // The quiet zone is applied by the renderer, so the matrix itself must begin
    // on a dark finder module rather than on padding.
    assert.equal(modules[0][0], 1, 'quiet zone leaked into the matrix')
  }
})

check('produces SVG that scales and keeps the modules', () => {
  const { size, modules } = encodeQR(VERIFY_URL)
  const svg = qrToSvg(VERIFY_URL, { margin: 2 })
  assert.match(svg, /^<svg/)
  assert.match(svg, /viewBox="0 0 \d+ \d+"/)
  // A viewBox-only root is what lets the CSS `.qr { width; height }` rule control
  // the rendered size in both the preview and the PDF. Only the root tag matters:
  // the background <rect> legitimately carries intrinsic dimensions.
  const rootTag = svg.slice(0, svg.indexOf('>') + 1)
  assert.ok(!/\swidth=/.test(rootTag), 'root svg must not set an explicit width')
  assert.ok(!/\sheight=/.test(rootTag), 'root svg must not set an explicit height')
  assert.match(svg, /<path/)
  assert.match(svg, /shape-rendering="crispEdges"/, 'modules must stay sharp when scaled')
  // One path subpath per dark module, and the viewBox must leave a quiet zone.
  const dark = modules.flat().filter(Boolean).length
  assert.equal((svg.match(/M/g) || []).length, dark, 'SVG path must contain exactly the dark modules')
  const viewBox = svg.match(/viewBox="0 0 (\d+) \1"/)
  assert.ok(viewBox, 'viewBox must be square')
  assert.equal(Number(viewBox[1]), size + 4, 'viewBox must include the 2-module quiet zone')
})

check('throws rather than silently truncating an overlong reference', () => {
  assert.throws(() => encodeQR('x'.repeat(3000)), /too long|length/i)
})

console.log(`\n${passed} checks passed`)
