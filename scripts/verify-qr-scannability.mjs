/**
 * Scannability test for the local QR encoder.
 *
 * The other renderer checks only assert structure. This one proves the codes are
 * actually readable: encode with our encoder, rasterise to an RGBA buffer, decode
 * with an independent decoder (jsQR), and compare the payload byte for byte.
 *
 * jsQR is fetched from a CDN at runtime. If the network is unavailable the test
 * skips rather than failing, so it is safe to run offline.
 *
 * Run with: node scripts/verify-qr-scannability.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import vm from 'node:vm'
import { encodeQR } from '../supabase/functions/generate-certificate-pdf/qrcode.js'

const REF_ENCODER = new URL('./qrcode-reference.umd.js', import.meta.url)

function loadUmdFrom(file, globalName) {
  const src = readFileSync(file, 'utf8')
  const box = { window: {}, document: {} }
  box.self = box
  box.globalThis = box
  vm.createContext(box)
  vm.runInContext(src, box)
  return box[globalName]
}

/** Rasterise a module matrix into an RGBA buffer with a quiet zone. */
function rasterise({ size, modules }, scale = 4, quiet = 4) {
  const dim = (size + quiet * 2) * scale
  const data = new Uint8ClampedArray(dim * dim * 4).fill(255)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!modules[r][c]) continue
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const y = (r + quiet) * scale + dy
          const x = (c + quiet) * scale + dx
          const i = (y * dim + x) * 4
          data[i] = 0
          data[i + 1] = 0
          data[i + 2] = 0
          data[i + 3] = 255
        }
      }
    }
  }
  return { data, width: dim, height: dim }
}

let jsQR
try {
  const res = await fetch('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const box = { window: {}, document: {} }
  box.self = box
  box.globalThis = box
  vm.createContext(box)
  vm.runInContext(await res.text(), box)
  jsQR = box.jsQR
} catch (error) {
  console.log(`\nSKIPPED — could not load the jsQR decoder (${error.message}).`)
  console.log('Structure-level QR checks still run via scripts/verify-certificate-renderer.mjs.\n')
  process.exit(0)
}

const qrgen = existsSync(REF_ENCODER) ? loadUmdFrom(REF_ENCODER, 'qrcode') : null

const samples = [
  'A',
  'CR-2026-000001',
  'https://www.career-radar.space/verify/v_0123456789abcdef0123456789abcdef0123456789abcdef',
  'https://career-radar.space/verify/v_ffffffffffffffffffffffffffffffffffffffffffffffff',
  'Verify me at https://example.org/verify/v_deadbeef',
  'https://www.career-radar.space/verify/certificate?token=v_00112233445566778899aabbccddeeff00112233',
  `https://www.career-radar.space/verify/v_${'9'.repeat(96)}`,
  'x'.repeat(200),
  'CR-2026-1 Organisation Test — Career Radar',
]

let passed = 0
let failed = 0

console.log('')
for (const text of samples) {
  const ours = encodeQR(text)
  const img = rasterise(ours)
  const decoded = jsQR(img.data, img.width, img.height)
  const label = text.length > 46 ? `${text.slice(0, 46)}…` : text

  let maskNote = ''
  if (qrgen) {
    const ref = qrgen(ours.version, 'M')
    ref.addData(text, 'Byte')
    ref.make()
    let diff = 0
    for (let r = 0; r < ours.size; r++) {
      for (let c = 0; c < ours.size; c++) {
        if ((ours.modules[r][c] ? 1 : 0) !== (ref.isDark(r, c) ? 1 : 0)) diff += 1
      }
    }
    maskNote = diff ? `  (mask differs from reference by ${diff} modules — still valid)` : '  (identical to reference)'
  }

  if (decoded && decoded.data === text) {
    passed += 1
    console.log(
      `  ok  v${String(ours.version).padStart(2)} ${String(ours.size).padStart(2)}x${ours.size}  decoded OK${maskNote}  "${label}"`,
    )
  } else {
    failed += 1
    console.log(
      `FAIL  v${ours.version} ${ours.size}x${ours.size}  decoded=${
        decoded ? JSON.stringify(decoded.data) : 'null'
      }  "${label}"`,
    )
    process.exitCode = 1
  }
}

console.log(`\n${passed} QR codes decoded, ${failed} failed`)
