/**
 * Structural checks on the certificates migration.
 *
 * These are static assertions, not a substitute for running the migration, but
 * they catch the class of mistake that is expensive to discover on a live
 * database: a SECURITY DEFINER function left executable by anon, a second
 * definition of the same function with a different signature, or a trigger whose
 * immutability guard forgets a column.
 *
 * Run with: node scripts/verify-certificate-migration.mjs
 */
import { readFileSync } from 'node:fs'

const SQL = readFileSync(
  new URL('../supabase/migrations/202610010001_add_certificates.sql', import.meta.url),
  'utf8',
)

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

/** Strip line comments so assertions are not satisfied by prose. */
const CODE = SQL.replace(/--[^\n]*/g, '')

function functionSignature(text, name) {
  const re = new RegExp(
    `CREATE OR REPLACE FUNCTION\\s+(?:public\\.)?${name}\\s*\\(([^)]*)\\)`,
    'gi',
  )
  return [...text.matchAll(re)].map((m) =>
    m[1]
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => p.replace(/\s+DEFAULT[\s\S]*$/i, '').trim())
      .join(','),
  )
}

/**
 * Return the body of a function definition: the text between the dollar-quote that
 * opens the body and the next dollar-quote. Comments have already been stripped, so
 * `$$` can only be a real body delimiter.
 */
function functionBody(text, name) {
  const start = text.search(
    new RegExp(`CREATE OR REPLACE FUNCTION\\s+(?:public\\.)?${name}\\s*\\(`, 'i'),
  )
  if (start === -1) throw new Error(`${name} is not defined in this migration`)
  const open = text.indexOf('$$', start)
  if (open === -1) throw new Error(`${name} has no dollar-quoted body`)
  const close = text.indexOf('$$', open + 2)
  if (close === -1) throw new Error(`${name} body is unterminated`)
  return text.slice(open + 2, close)
}

console.log('\nmigration structure')

check('defines the four certificate tables', () => {
  for (const table of [
    'certificate_templates',
    'certificates',
    'certificate_verification_events',
    'certificate_audit_logs',
  ]) {
    if (!CODE.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
      throw new Error(`missing table ${table}`)
    }
  }
})

check('enables RLS on every certificate table', () => {
  for (const table of [
    'certificate_templates',
    'certificates',
    'certificate_verification_events',
    'certificate_audit_logs',
  ]) {
    if (!CODE.includes(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`)) {
      throw new Error(`RLS not enabled on ${table}`)
    }
  }
})

check('grants anon no direct read of the certificates table', () => {
  const policies = [...CODE.matchAll(/CREATE POLICY\s+"?([^"\s]+)"?\s+ON\s+certificates\b[\s\S]*?;/gi)]
    .map((m) => m[0])
  const anonRead = policies.filter((p) => {
    const isSelect = /FOR SELECT/i.test(p)
    const allowsAnon = /auth\.role\(\)\s*\)?\s*=\s*'anon'/.test(p) && !/get_my_role/.test(p)
    return isSelect && allowsAnon
  })
  if (anonRead.length) {
    throw new Error(`${anonRead.length} policy/policies would expose certificates to anon`)
  }
})

console.log('\nfunction privileges')

const DEFINER_FUNCTIONS = [
  'public_verify_certificate',
  'reissue_certificate',
  'revoke_certificate',
  'log_certificate_audit',
  'record_certificate_verification',
  'record_certificate_download',
  'set_certificate_defaults',
  'protect_certificate_record',
  'bump_certificate_template_version',
]

for (const fn of DEFINER_FUNCTIONS) {
  check(`${fn} is not executable by PUBLIC`, () => {
    if (!CODE.includes(`FUNCTION ${fn}(`) && !CODE.includes(`FUNCTION public.${fn}(`)) {
      throw new Error(`${fn} is not defined in this migration`)
    }
    const revoked = CODE.includes(`ON FUNCTION ${fn}(`) &&
      CODE.includes(`FROM PUBLIC`)
    if (!revoked) {
      throw new Error(`no "REVOKE ALL ON FUNCTION ${fn}(...) FROM PUBLIC"`)
    }
  })
}

check('only the public verification RPC is granted to anon', () => {
  const grants = [...CODE.matchAll(/GRANT EXECUTE ON FUNCTION[^;]*;/gi)].map((m) => m[0])
  const toAnon = grants.filter((g) => /\bTO\b[^;]*\banon\b/i.test(g))
  if (toAnon.length !== 1 || !/public_verify_certificate/.test(toAnon[0])) {
    throw new Error(
      `expected exactly one anon grant (public_verify_certificate), found ${toAnon.length}: ${toAnon.join(' | ')}`,
    )
  }
})

check('the edge counter functions are executable by service_role', () => {
  const grants = [...CODE.matchAll(/GRANT EXECUTE ON FUNCTION[^;]*;/gi)].map((m) => m[0])
  // service_role bypasses RLS but not the function ACL, so these must be granted
  // explicitly or the edge functions would fail at runtime with a permission error.
  for (const fn of ['record_certificate_verification', 'record_certificate_download']) {
    if (!grants.some((g) => new RegExp(`${fn}\\(`).test(g) && /\bTO\b[^;]*\bservice_role\b/.test(g))) {
      throw new Error(`${fn} is not granted to service_role`)
    }
  }
})

check('a download writes both a counter bump and an audit row', () => {
  const block = functionBody(CODE, 'record_certificate_download')
  if (!/SET download_count = download_count \+ 1/.test(block)) throw new Error('no counter bump')
  if (!/INSERT INTO certificate_audit_logs/.test(block)) {
    throw new Error('downloads leave no audit trail')
  }
  if (!/'certificate_downloaded'/.test(block)) throw new Error('no download audit action')
  // The parameter list sits outside the dollar-quoted body.
  const signature = CODE.slice(
    CODE.indexOf('CREATE OR REPLACE FUNCTION record_certificate_download('),
    CODE.indexOf('$$', CODE.indexOf('CREATE OR REPLACE FUNCTION record_certificate_download(')),
  )
  if (!/p_actor UUID DEFAULT NULL/.test(signature)) {
    throw new Error('the edge function cannot attribute the download')
  }
  // The unaudited 3-argument twin must not survive a re-run.
  if (!/DROP FUNCTION IF EXISTS record_certificate_download\(UUID, TEXT, TEXT\)/.test(CODE)) {
    throw new Error('the unaudited 3-arg form is not dropped')
  }
})

check('a public download is attributed by channel, not by a fake user', () => {
  const block = functionBody(CODE, 'record_certificate_download')
  if (!/COALESCE\(p_actor, auth\.uid\(\)\)/.test(block)) {
    throw new Error('the actor does not fall back to the session')
  }
  if (!/'channel'/.test(block)) throw new Error('the channel is not recorded')
})

check('public verification is reachable by anon', () => {
  const grants = [...CODE.matchAll(/GRANT EXECUTE ON FUNCTION[^;]*;/gi)].map((m) => m[0])
  if (!grants.some((g) => /public_verify_certificate/.test(g) && /\banon\b/.test(g))) {
    throw new Error('the public verify RPC is not granted to anon, so nobody could verify')
  }
})

check('each function is defined exactly once', () => {
  for (const fn of DEFINER_FUNCTIONS) {
    const signatures = functionSignature(CODE, fn)
    const unique = new Set(signatures)
    if (signatures.length !== 1 || unique.size !== 1) {
      throw new Error(`${fn} defined ${signatures.length} time(s): ${[...unique].join(' | ')}`)
    }
  }
})

check('no role can insert audit rows directly', () => {
  const policies = [...CODE.matchAll(/CREATE POLICY\s+"?([^"\s]+)"?\s+ON\s+certificate_audit_logs\b[\s\S]*?;/gi)]
    .map((m) => m[0])
  const inserts = policies.filter((p) => /FOR INSERT/i.test(p))
  if (inserts.length) {
    throw new Error(`direct audit inserts are still possible: ${inserts[0].slice(0, 80)}`)
  }
  // Every legitimate write must therefore go through a definer function.
  // SECURITY DEFINER sits in the header, between the parameter list and the body.
  for (const fn of ['log_certificate_audit', 'record_certificate_download']) {
    const header = CODE.slice(
      CODE.indexOf(`CREATE OR REPLACE FUNCTION ${fn}(`),
      CODE.indexOf('$$', CODE.indexOf(`CREATE OR REPLACE FUNCTION ${fn}(`)),
    )
    if (!/SECURITY DEFINER/.test(header)) {
      throw new Error(`${fn} is not SECURITY DEFINER, so it cannot write past RLS`)
    }
    if (!/SET search_path = public/.test(header)) {
      throw new Error(`${fn} has no pinned search_path`)
    }
  }
})

check('the audit writer ignores a caller-supplied actor', () => {
  const block = functionBody(CODE, 'log_certificate_audit')
  if (/COALESCE\(\s*p_performed_by/.test(block)) {
    throw new Error('p_performed_by is trusted, so an admin could forge the actor')
  }
  if (!/v_actor\s+UUID\s*:=\s*auth\.uid\(\)/.test(block)) {
    throw new Error('the actor is not taken from auth.uid()')
  }
  if (!/get_my_role\(\)\s+NOT IN \('super_admin','admin'\)/.test(block)) {
    throw new Error('the audit writer has no role gate')
  }
})

check('authorisation failures in the audit writer are not swallowed', () => {
  const block = functionBody(CODE, 'log_certificate_audit')
  if (!/EXCEPTION WHEN OTHERS THEN/.test(block)) {
    throw new Error('expected an exception handler')
  }
  if (!/SQLERRM LIKE 'Not authorised%'/.test(block)) {
    throw new Error('the handler would swallow the authorisation error')
  }
  if (!/RAISE\s*;\s*END IF;/.test(block)) {
    throw new Error('the handler does not re-raise before falling through to the warning')
  }
})

console.log('\nimmutability guard')

check('guards every issued-content column', () => {
  const block = functionBody(CODE, 'protect_certificate_record')
  for (const column of [
    'certificate_id',
    'verification_token',
    'recipient_name',
    'recipient_email',
    'certificate_title',
    'issue_date',
    'organization_name',
    'template_snapshot',
    'template_version',
    'custom_fields',
    'issued_by',
    'issue_batch_id',
  ]) {
    if (!new RegExp(`NEW\\.${column}\\s+IS DISTINCT FROM`).test(block)) {
      throw new Error(`${column} is mutable`)
    }
  }
})

check('leaves pdf_path writable for the edge function', () => {
  const block = functionBody(CODE, 'protect_certificate_record')
  if (/NEW\.pdf_path\s+IS DISTINCT FROM/.test(block)) {
    throw new Error('pdf_path is frozen, so the generator cannot record its output')
  }
  if (/NEW\.pdf_generated_at\s+IS DISTINCT FROM/.test(block)) {
    throw new Error('pdf_generated_at is frozen')
  }
})

check('requires a reason when revoking but not when superseding', () => {
  const block = functionBody(CODE, 'protect_certificate_record')
  if (!/NEW\.status = 'revoked'/.test(block)) {
    throw new Error('revocation is not distinguished from supersede')
  }
  if (!/btrim\(COALESCE\(NEW\.revocation_reason, ''\)\) = ''/.test(block)) {
    throw new Error('an empty revocation reason would be accepted')
  }
})

check('only the counter functions may move the counters', () => {
  for (const fn of ['record_certificate_verification', 'record_certificate_download']) {
    if (!functionBody(CODE, fn).includes(`set_config('certificates.system_write', 'on', true)`)) {
      throw new Error(`${fn} does not raise the system_write flag`)
    }
  }
  const block = functionBody(CODE, 'protect_certificate_record')
  if (!/current_setting\('certificates\.system_write', true\)\s+IS DISTINCT FROM 'on'/.test(block)) {
    throw new Error('the guard does not consult the system_write flag')
  }
  // The flag must be transaction-local so it cannot leak into a client statement.
  if (!/set_config\('certificates\.system_write', 'on', true\)/.test(CODE)) {
    throw new Error('set_config is not transaction-local')
  }
})

console.log('\ntemplate versioning')

check('templates carry a version', () => {
  if (!/version INTEGER NOT NULL DEFAULT 1 CHECK \(version >= 1\)/.test(CODE)) {
    throw new Error('certificate_templates has no version column')
  }
})

check('a design change bumps the version, a rename does not', () => {
  const block = functionBody(CODE, 'bump_certificate_template_version')
  for (const column of [
    'design',
    'orientation',
    'page_size',
    'background_url',
    'border_config',
    'default_font_family',
    'default_font_color',
  ]) {
    if (!new RegExp(`NEW\\.${column}\\s+IS DISTINCT FROM`).test(block)) {
      throw new Error(`${column} can change without a version bump`)
    }
  }
  // name/description/is_active/usage_locked are deliberately not in the list:
  // renaming a template does not change what an issued certificate looks like.
  for (const column of ['name', 'is_active', 'usage_locked']) {
    if (new RegExp(`NEW\\.${column}\\s+IS DISTINCT FROM`).test(block)) {
      throw new Error(`${column} should not bump the version`)
    }
  }
  if (!/NEW\.version := OLD\.version \+ 1/.test(block)) throw new Error('no increment')
  if (!/NEW\.version IS DISTINCT FROM OLD\.version/.test(block)) {
    throw new Error('an explicit version write would be overwritten')
  }
})

check('the version trigger is installed on the templates table', () => {
  if (!/CREATE TRIGGER certificate_templates_version BEFORE UPDATE ON certificate_templates/.test(CODE)) {
    throw new Error('no BEFORE UPDATE trigger bumps the version')
  }
})

check('reissue keeps the chain intact and demands a reason', () => {
  const block = functionBody(CODE, 'reissue_certificate')
  if (!/btrim\(COALESCE\(p_reason, ''\)\) = ''/.test(block)) {
    throw new Error('an unexplained reissue would be allowed')
  }
  if (!/status = 'superseded'/.test(block)) throw new Error('the old certificate is not superseded')
  if (!/superseded_by_id = v_new\.id/.test(block)) throw new Error('the forward link is not set')
  if (!/v_old\.custom_fields, v_old\.id/.test(block)) {
    throw new Error('the backward link (supersedes_id) is not set from the old row')
  }
  // The replacement must carry the old frozen design forward; re-deriving it from
  // the live template would silently restyle a certificate.
  if (!/v_old\.template_snapshot, v_old\.template_version/.test(block)) {
    throw new Error('reissue does not carry the frozen snapshot forward')
  }
})

check('revoke requires a reason and records the actor', () => {
  const block = functionBody(CODE, 'revoke_certificate')
  if (!/btrim\(COALESCE\(p_reason, ''\)\) = ''/.test(block)) {
    throw new Error('a revoke without a reason would be allowed')
  }
  if (!/revoked_by = v_actor/.test(block)) throw new Error('the revoker is not recorded')
  if (!/get_my_role\(\) NOT IN \('super_admin','admin'\)/.test(block)) {
    throw new Error('no role gate')
  }
})

console.log('\nwell-formedness')

/**
 * Without a PostgreSQL instance to parse against, catch the gross syntax errors
 * that would abort the whole migration on the first statement — an unbalanced
 * dollar-quote or paren silently truncates every statement after it.
 */
check('dollar quotes are balanced', () => {
  // Strip single-quoted literals first so a '$$' inside a string is not counted.
  const stripped = CODE.replace(/'(?:[^']|'')*'/g, "''")
  const opens = (stripped.match(/\$\$/g) || []).length
  if (opens % 2 !== 0) throw new Error(`${opens} dollar quotes — an odd count means an unterminated body`)
  const bodies = (stripped.match(/\$\$[\s\S]*?\$\$/g) || []).length
  if (bodies * 2 !== opens) throw new Error('a dollar-quoted body is unterminated')
})

check('parentheses are balanced outside literals', () => {
  const stripped = CODE.replace(/'(?:[^']|'')*'/g, "''")
  let depth = 0
  for (const char of stripped) {
    if (char === '(') depth += 1
    else if (char === ')') {
      depth -= 1
      if (depth < 0) throw new Error('a closing parenthesis appears before its opener')
    }
  }
  if (depth !== 0) throw new Error(`${depth} unclosed parenthesis/parentheses`)
})

check('statements are terminated', () => {
  const statements = CODE.split(';').length - 1
  if (statements < 20) throw new Error(`only ${statements} statements found; the file looks truncated`)
})

check('every CREATE TRIGGER has a matching function', () => {
  const triggers = [...CODE.matchAll(/EXECUTE FUNCTION\s+(\w+)\(\)/g)].map((m) => m[1])
  for (const fn of new Set(triggers)) {
    // handle_updated_at() comes from an earlier migration in this project.
    if (fn === 'handle_updated_at') continue
    if (!CODE.includes(`CREATE OR REPLACE FUNCTION ${fn}(`)) {
      throw new Error(`trigger function ${fn} is not defined in this migration`)
    }
  }
})

console.log('\nidentifiers and idempotency')

check('certificate numbers and tokens are unique', () => {
  if (!/certificate_id TEXT NOT NULL UNIQUE/.test(CODE)) throw new Error('certificate_id is not unique')
  if (!/verification_token TEXT NOT NULL UNIQUE/.test(CODE)) {
    throw new Error('verification_token is not unique')
  }
})

check('a retried batch cannot double-issue', () => {
  const statement = CODE.slice(
    CODE.lastIndexOf('CREATE UNIQUE INDEX IF NOT EXISTS', CODE.indexOf('idx_certificates_batch_recipient')),
  ).split(';')[0]
  if (!/ON certificates\(issue_batch_id, lower\(recipient_name\)\)/.test(statement)) {
    throw new Error(`unexpected index definition: ${statement.slice(0, 120)}`)
  }
  if (!/WHERE issue_batch_id IS NOT NULL/.test(statement)) {
    throw new Error('single certificates would be constrained too')
  }
})

check('a token scan resolves against the token, not the number', () => {
  const block = functionBody(CODE, 'public_verify_certificate')
  if (!/v_method IN \('verification_url','qr_code'\)/.test(block)) {
    throw new Error('qr_code does not share the token lookup path')
  }
  // Both branches must stay sargable: a bare column comparison can use the UNIQUE
  // index, whereas upper(certificate_id) = upper($1) forces a sequential scan on
  // every public verification request.
  if (!/verification_token = lower\(v_ref\)/.test(block)) throw new Error('token lookup is not sargable')
  if (!/certificate_id = upper\(v_ref\)/.test(block)) throw new Error('number lookup is not sargable')
  if (/upper\(certificate_id\)\s*=/.test(block)) {
    throw new Error('upper() on the column side defeats the unique index')
  }
})

console.log('\nstorage')

check('PDFs are private and assets are durable', () => {
  if (!/VALUES \('certificate-pdfs', 'certificate-pdfs', false/.test(CODE)) {
    throw new Error('the PDF bucket is not private')
  }
  if (!/VALUES \('certificate-assets', 'certificate-assets', true/.test(CODE)) {
    throw new Error('the artwork bucket is not publicly readable, so it would expire')
  }
  const assetWrite = [...CODE.matchAll(/CREATE POLICY "cert_assets_admin_(?:insert|update|delete)"[\s\S]*?;/gi)]
  for (const [policy] of assetWrite) {
    if (!/get_my_role\(\) IN \('super_admin','admin'\)/.test(policy)) {
      throw new Error('an artwork write policy is not admin-restricted')
    }
  }
})

console.log('\nviews')

check('stats views run as the caller so RLS applies', () => {
  const views = [...CODE.matchAll(/CREATE OR REPLACE VIEW\s+(\w+)\s+WITH \(security_invoker = true\)/gi)]
  if (views.length < 2) throw new Error('expected two security_invoker views')
})

check('views do not have policies (security_invoker handles RLS)', () => {
  const viewPolicies = [...CODE.matchAll(/CREATE POLICY.*ON (certificate_stats|certificate_template_stats)/gi)]
  if (viewPolicies.length > 0) {
    throw new Error('views with security_invoker should not have policies - RLS is enforced from underlying tables')
  }
})

console.log(`\n${passed} checks passed`)
