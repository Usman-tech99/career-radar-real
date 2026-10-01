/**
 * Parses whatever a visitor pasted into a certificate reference.
 *
 * Kept free of any dependency — not even the Supabase client — because it is pure
 * string handling and therefore directly testable, and because importing it must
 * never pull a browser-only module into a script.
 */

const TOKEN_PATTERN = /^v_[0-9a-f]{16,}$/i

/** Query parameter names the app itself uses to carry a reference. */
const REFERENCE_PARAMS = ['ref', 'token', 'certificate_id']

/**
 * People paste the whole share link, so comparing the raw string would send
 * "https://…/verify/v_abc123" to the lookup and report "not found". This pulls
 * the reference back out of a link, a bare token, or a typed number.
 *
 * Returns `{ reference, method }`, or null when nothing usable was supplied.
 * `method` distinguishes a token (look it up in `verification_token`) from a
 * human-readable number (look it up in `certificate_id`).
 */
export function parseCertificateReference(input) {
  let candidate = String(input || '').trim()
  if (!candidate) return null

  const isUrl = /^[a-z][a-z0-9+.-]*:\/\//i.test(candidate) || candidate.startsWith('/') || candidate.includes('/')

  if (isUrl) {
    // Strip the scheme and host, keeping the query string intact so a
    // /verify?ref=… link can still be read.
    const hadScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)
    const withoutScheme = candidate.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
    const [beforeHash] = withoutScheme.split('#')
    const [pathPart, queryPart = ''] = beforeHash.split('?')

    const segments = pathPart.split('/').filter(Boolean)
    // With an explicit scheme the first segment is always the host. Without one,
    // only treat it as a host when there is a path after it, so a bare
    // "host/verify/TOKEN" still works but "host/" does not become a reference.
    if (hadScheme && segments.length) {
      segments.shift()
    } else if (segments.length > 1 && /\.[a-z]{2,}(?::\d+)?$/i.test(segments[0])) {
      segments.shift()
    }

    // Prefer an explicit query parameter, because it is unambiguous.
    let fromQuery = null
    for (const params of queryPart.split('&')) {
      const [rawKey, rawValue = ''] = params.split('=')
      if (REFERENCE_PARAMS.includes(decodeMaybe(rawKey).trim().toLowerCase())) {
        fromQuery = decodeMaybe(rawValue)
        if (fromQuery) break
      }
    }

    candidate = fromQuery ?? segments[segments.length - 1] ?? ''
  }

  candidate = decodeMaybe(candidate).trim().replace(/^["']|["']$/g, '')

  if (!candidate) return null
  // "verify" is a route, not a reference. Returning it would send a guaranteed
  // miss to the database and pollute the verification event log.
  if (/^verify$/i.test(candidate)) return null

  return {
    reference: candidate,
    method: TOKEN_PATTERN.test(candidate) ? 'verification_url' : 'certificate_id',
  }
}

/** decodeURIComponent throws on a malformed escape; a bad paste is not fatal. */
function decodeMaybe(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
