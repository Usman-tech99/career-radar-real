/**
 * Cross-checks the certificate admin surface for wiring mistakes that no single
 * file reveals on its own.
 *
 * The failure this guards against is real and was hit once: `ProtectedRoute`
 * gates `/admin/certificates` on `manage_certificates`, but that permission was
 * missing from the hardcoded lists in `AuthContext`, so every admin — including
 * super admins — was redirected away from a page that looked correct in review.
 *
 * Run with: node scripts/verify-certificate-routes.mjs
 */
import { readFileSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

const auth = read('src/context/AuthContext.jsx')
const protectedRoute = read('src/routes/ProtectedRoute.jsx')
const layout = read('src/components/layout/AdminLayout.jsx')
const app = read('src/App.jsx')

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

/** Every permission the certificate pages are gated on. */
const REQUIRED = 'manage_certificates'

console.log('\npermission wiring')

check('the certificate pages are gated on a permission', () => {
  const mappings = [...protectedRoute.matchAll(/'(\/admin\/certificates[^']*)'\s*:\s*'([\w_]+)'/g)]
    .map((m) => ({ path: m[1], permission: m[2] }))
  if (mappings.length < 3) throw new Error(`expected 3 certificate routes, found ${mappings.length}`)
  for (const { path, permission } of mappings) {
    if (permission !== REQUIRED) throw new Error(`${path} is gated on ${permission}, not ${REQUIRED}`)
  }
})

check('the permission exists in the super_admin list', () => {
  const superAdmin = auth.slice(auth.indexOf('const allPermissions'), auth.indexOf('setPermissions(allPermissions)'))
  if (!superAdmin.includes(REQUIRED)) {
    throw new Error(`${REQUIRED} is missing from allPermissions, so super admins cannot open the pages`)
  }
})

check('the permission exists in the default admin list', () => {
  const start = auth.indexOf('const defaultAdminPermissions')
  if (start === -1) throw new Error('defaultAdminPermissions was removed')
  const block = auth.slice(start, auth.indexOf(']', start))
  if (!block.includes(REQUIRED)) {
    throw new Error(`${REQUIRED} is missing from defaultAdminPermissions`)
  }
})

console.log('\nroutes and navigation')

check('every certificate route is registered', () => {
  for (const path of [
    '/admin/certificates',
    '/admin/certificates/templates',
    '/admin/certificates/issue',
    '/verify',
    '/verify/:token',
  ]) {
    if (!app.includes(`path="${path}"`)) throw new Error(`missing route ${path}`)
  }
})

check('certificate pages are code-split', () => {
  // A single admin page should not ship to every visitor of the marketing site.
  for (const page of [
    'ManageCertificates',
    'ManageCertificateTemplates',
    'IssueCertificate',
  ]) {
    if (!new RegExp(`lazy\\(\\s*\\(\\)\\s*=>\\s*import\\([^)]*${page}`).test(app)) {
      throw new Error(`${page} is not lazily imported`)
    }
  }
})

// Nav items are declared as `{ label, path, icon, perm }` objects, not `to:` props.
const NAV_ITEMS = [...layout.matchAll(/\{[^{}]*path:\s*'(\/admin\/certificates[^']*)'[^{}]*\}/g)].map((m) => ({
  path: m[1],
  text: m[0],
}))

check('every sidebar entry points at a real route', () => {
  if (NAV_ITEMS.length < 3) throw new Error(`expected 3 sidebar entries, found ${NAV_ITEMS.length}`)
  for (const { path: to } of NAV_ITEMS) {
    if (!app.includes(`path="${to}"`)) throw new Error(`sidebar links to unregistered route ${to}`)
  }
})

check('sidebar entries are permission-filtered like the routes', () => {
  for (const { path: to, text } of NAV_ITEMS) {
    if (!text.includes(`perm: '${REQUIRED}'`)) {
      throw new Error(`${to} is not gated on ${REQUIRED}: ${text.replace(/\s+/g, ' ').slice(0, 90)}`)
    }
  }
})

check('a nested certificate route keeps its parent highlighted', () => {
  // Without this, opening /admin/certificates/issue shows no active nav item and
  // the admin has no way back to the certificate list.
  if (!/startsWith\(/.test(layout)) {
    throw new Error('nested-route highlighting is not prefix based')
  }
})

console.log('\npublic verification surface')

check('the verify page is reachable without authentication', () => {
  // A public route that sits under a guard is the single most damaging mistake
  // possible here: every QR code in the world would dead-end.
  const guarded = /path="\/verify[^"]*"[\s\S]{0,120}<ProtectedRoute/.test(app)
  if (guarded) throw new Error('/verify appears to be wrapped in a protected route')
  const anonymous = /element=\{?<VerifyCertificate/.test(app)
  if (!anonymous) throw new Error('VerifyCertificate is not mounted as a route element')
})

check('the edge functions are configured to skip JWT verification', () => {
  const config = read('supabase/config.toml')
  for (const fn of ['verify-certificate', 'generate-certificate-pdf']) {
    const block = config.slice(config.indexOf(`[functions.${fn}]`))
    const next = block.indexOf('\n[')
    const section = next === -1 ? block : block.slice(0, next)
    if (!/verify_jwt\s*=\s*false/.test(section)) {
      throw new Error(`${fn} does not set verify_jwt = false`)
    }
  }
})

console.log('\nreference parsing')

check('the pasted-link parser is exported and used', () => {
  const lib = read('src/lib/certificates.js')
  if (!/export \{ parseCertificateReference \}|export function parseCertificateReference/.test(lib)) {
    throw new Error('parseCertificateReference is not exported from the service layer')
  }
  const page = read('src/pages/public/VerifyCertificate.jsx')
  if (!/parseCertificateReference\(/.test(page)) {
    throw new Error('the verify page does not use the parser')
  }
  // Tokens must be recognised as tokens, otherwise a scanned code is looked up as
  // a certificate number and reports "not found".
  const parser = read('src/lib/certificateReference.js')
  if (!/\^v_\[0-9a-f\]\{16,\}\$/i.test(parser)) {
    throw new Error('the token pattern is missing or too permissive')
  }
})

check('the public PDF link is requested on click, not during verification', () => {
  const page = read('src/pages/public/VerifyCertificate.jsx')
  if (!/requestPublicCertificatePdf\(/.test(page)) {
    throw new Error('the page never requests a PDF')
  }
  // A signed URL minted during verification would inflate the download counter
  // with every page view.
  const lib = read('src/lib/certificates.js')
  if (!/action: 'pdf'/.test(lib)) throw new Error('no separate pdf action is sent')
  const fn = read('supabase/functions/verify-certificate/index.ts')
  if (!/action !== 'pdf'\)\s*action = 'verify'/.test(fn)) {
    throw new Error('the edge function does not separate the two actions')
  }
})

console.log(`\n${passed} checks passed`)
