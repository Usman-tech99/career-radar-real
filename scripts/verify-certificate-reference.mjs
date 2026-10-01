/**
 * Table-driven tests for the pasted-reference parser.
 *
 * Every case here is something a real visitor does: copy the whole share link
 * from an email, paste it with the browser's context menu, type the number in
 * lowercase, or scan a QR code. A regression here means a QR code dead-ends at
 * "no certificate found", which is the worst failure this feature can have.
 *
 * Run with: node scripts/verify-certificate-reference.mjs
 */
import { parseCertificateReference } from '../src/lib/certificateReference.js'

let passed = 0
let failed = 0

function expect(input, want, note) {
  const got = parseCertificateReference(input)
  const a = JSON.stringify(got)
  const b = JSON.stringify(want)
  if (a === b) {
    passed += 1
    console.log(`  ok  ${JSON.stringify(input)}${note ? `  — ${note}` : ''}`)
  } else {
    failed += 1
    console.error(`FAIL  ${JSON.stringify(input)}\n      expected ${b}\n      got      ${a}`)
    process.exitCode = 1
  }
}

const TOKEN = 'v_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

console.log('\ntyped certificate numbers')

expect('CR-2026-000001', { reference: 'CR-2026-000001', method: 'certificate_id' })
expect('  CR-2026-000001  ', { reference: 'CR-2026-000001', method: 'certificate_id' })
expect('cr-2026-000001', { reference: 'cr-2026-000001', method: 'certificate_id' }, 'case is normalised server-side')
expect('CR-2026-000001.', { reference: 'CR-2026-000001.', method: 'certificate_id' }, 'trailing punctuation is the user\'s typo, not ours to fix')
expect('"CR-2026-000001"', { reference: 'CR-2026-000001', method: 'certificate_id' }, 'pasted from a spreadsheet')

console.log('\nbare tokens')

expect(TOKEN, { reference: TOKEN, method: 'verification_url' })
expect(`  ${TOKEN.toUpperCase()} `, { reference: TOKEN.toUpperCase(), method: 'verification_url' }, 'uppercase tokens still count as tokens')
expect(TOKEN.slice(0, 14), { reference: TOKEN.slice(0, 14), method: 'certificate_id' }, 'a truncated token is not mistaken for a valid one')

console.log('\nfull verification links')

for (const prefix of [
  'https://www.career-radar.space/verify/',
  'https://career-radar.space/verify/',
  'http://localhost:5173/verify/',
  'www.career-radar.space/verify/',
  '/verify/',
]) {
  expect(`${prefix}${TOKEN}`, { reference: TOKEN, method: 'verification_url' }, prefix)
}

expect(`https://career-radar.space/verify/${TOKEN}?utm_source=email`, {
  reference: TOKEN,
  method: 'verification_url',
}, 'tracking parameters are discarded')

expect(`https://career-radar.space/verify/${TOKEN}#anchor`, {
  reference: TOKEN,
  method: 'verification_url',
}, 'fragments are discarded')

expect(`https://career-radar.space/verify/${encodeURIComponent(TOKEN)}`, {
  reference: TOKEN,
  method: 'verification_url',
}, 'percent-encoded token is decoded once')

expect(`https://career-radar.space/verify?ref=${TOKEN}`, {
  reference: TOKEN,
  method: 'verification_url',
}, 'query-string form')

console.log('\nnothing usable')

expect('', null)
expect('   ', null)
expect(null, null)
expect(undefined, null)
expect('https://career-radar.space/verify/', null, 'a link with no token')
expect('https://career-radar.space/', null, 'just the site root')
expect('/verify/', null)

console.log('\nnon-certificate input is not swallowed silently')

// Anything that cannot be a reference must return null so the UI can refuse to
// submit, rather than sending junk to the database and recording a bogus
// not-found verification event against the audit trail.
expect('hello world', { reference: 'hello world', method: 'certificate_id' })

console.log(`\n${passed} passed, ${failed} failed`)
