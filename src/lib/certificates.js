import { supabase } from './supabase'
import { parseCertificateReference } from './certificateReference'
import {
  renderCertificateHtml,
  normalizeDesign,
  previewValues,
} from '../../supabase/functions/generate-certificate-pdf/certificateHtml.js'

// Re-exported so callers have one import site for certificate helpers.
export { parseCertificateReference }

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
const CERTIFICATES_BUCKET = 'certificate-pdfs'

export const CERTIFICATE_TYPES = [
  { value: 'course_completion', label: 'Course Completion' },
  { value: 'internship', label: 'Internship' },
  { value: 'participation', label: 'Participation' },
  { value: 'achievement', label: 'Achievement' },
  { value: 'appreciation', label: 'Appreciation' },
  { value: 'custom', label: 'Custom' },
]

export const CERTIFICATE_STATUSES = ['valid', 'revoked', 'superseded', 'expired']

export function certificateTypeLabel(value) {
  return CERTIFICATE_TYPES.find((t) => t.value === value)?.label || 'Custom'
}

export function certificateVerifyUrl(token) {
  if (!token) return ''
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/verify/${token}`
}

/** Template shape sent to the renderer; keeps the frozen copy self-describing. */
function snapshotFromTemplate(template, overrides = {}) {
  const design = normalizeDesign(template.design || {})
  return {
    ...design,
    ...overrides,
    certificate_type: template.certificate_type,
    template_id: template.id,
    template_name: template.name,
    // The version travels inside the snapshot too, so a PDF rendered years later
    // can state which design revision produced it without joining the template.
    template_version: templateVersion(template),
    orientation: template.orientation,
    page_size: template.page_size,
    backgroundUrl: template.background_url || design.backgroundUrl || '',
  }
}

/**
 * Design revision to stamp on a certificate. Templates created before versioning
 * existed have no `version` column value, so fall back to 1 rather than writing
 * NULL into a NOT NULL column.
 */
export function templateVersion(template) {
  const version = Number(template?.version)
  return Number.isInteger(version) && version >= 1 ? version : 1
}

export { snapshotFromTemplate, renderCertificateHtml, normalizeDesign, previewValues }

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------
/**
 * Best-effort audit write. Never throws: losing an audit line must not roll back
 * the admin action that succeeded, and the database raises a warning in the
 * same situation.
 */
async function audit(action, { templateId, certificateId, detail } = {}) {
  try {
    await supabase.rpc('log_certificate_audit', {
      p_action: action,
      p_certificate_id: certificateId || null,
      p_template_id: templateId || null,
      p_performed_by: null,
      p_detail: detail || {},
    })
  } catch {
    /* intentionally ignored */
  }
}

export async function listTemplates({ includeInactive = true } = {}) {
  let query = supabase
    .from('certificate_templates')
    .select('*')
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false })

  if (!includeInactive) query = query.eq('is_active', true)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createTemplate(payload) {
  const { data, error } = await supabase
    .from('certificate_templates')
    .insert({ ...payload, usage_locked: false })
    .select()
    .single()
  if (error) throw error
  await audit('template_created', {
    templateId: data.id,
    detail: { name: data.name, certificate_type: data.certificate_type },
  })
  return data
}

export async function updateTemplate(id, payload) {
  const { data, error } = await supabase
    .from('certificate_templates')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  await audit('template_updated', {
    templateId: id,
    detail: {
      name: data.name,
      changed: Object.keys(payload).filter(
        (key) => !['updated_at'].includes(key)
      ),
    },
  })
  return data
}

export async function duplicateTemplate(id, newName) {
  const { data: source, error: readError } = await supabase
    .from('certificate_templates')
    .select('*')
    .eq('id', id)
    .single()
  if (readError) throw readError

  const copy = await createTemplate({
    name: newName || `${source.name} (copy)`,
    description: source.description,
    certificate_type: source.certificate_type,
    design: source.design,
    orientation: source.orientation,
    page_size: source.page_size,
    background_url: source.background_url,
    border_config: source.border_config,
    default_font_family: source.default_font_family,
    default_font_color: source.default_font_color,
    is_active: false,
  })

  await audit('template_duplicated', {
    templateId: copy.id,
    detail: { name: copy.name, source_template_id: id, source_name: source.name },
  })
  return copy
}

export async function setTemplateActive(id, isActive) {
  const template = await updateTemplate(id, { is_active: isActive })
  await audit(isActive ? 'template_activated' : 'template_deactivated', {
    templateId: id,
    detail: { name: template.name },
  })
  return template
}

export async function deleteTemplate(id) {
  const { data, error } = await supabase
    .from('certificate_templates')
    .delete()
    .eq('id', id)
    .select('id, name')
    .maybeSingle()
  if (error) throw error
  await audit('template_deleted', {
    templateId: id,
    detail: { name: data?.name || null },
  })
}

/** Templates that already have issued certificates cannot be hard-deleted. */
export async function templateUsageCount(id) {
  const { count, error } = await supabase
    .from('certificates')
    .select('id', { count: 'exact', head: true })
    .eq('template_id', id)
  if (error) throw error
  return count || 0
}

export async function fetchTemplateStats() {
  const { data, error } = await supabase
    .from('certificate_template_stats')
    .select('*')
    .order('issued_count', { ascending: false })
  if (error) return []
  return data || []
}

// ---------------------------------------------------------------------------
// Issuance
// ---------------------------------------------------------------------------
/**
 * Issues one or more certificates against a template.
 * The template design is frozen into each certificate's snapshot so later edits
 * to the template cannot rewrite history.
 */
export async function issueCertificates({
  templateId,
  recipients,
  organizationName,
  organizationLogoUrl,
  signatory1,
  signatory2,
  description,
  achievement,
  issueDate,
  customFields = {},
  batchId,
}) {
  if (!templateId) throw new Error('Select a certificate template first')
  if (!recipients?.length) throw new Error('Add at least one recipient')

  const { data: template, error: templateError } = await supabase
    .from('certificate_templates')
    .select('*')
    .eq('id', templateId)
    .single()
  if (templateError) throw templateError
  if (!template.is_active) throw new Error('That template is deactivated. Activate it before issuing.')

  const snapshot = snapshotFromTemplate(template)
  // Read the version from the same row the snapshot was built from, so the stamp
  // and the frozen design can never disagree.
  const version = templateVersion(template)

  // Resolved once rather than per recipient: the audit trail must attribute the
  // batch to a single authenticated issuer.
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) throw new Error('Your session expired. Sign in again to issue certificates.')
  const issuedBy = userData.user.id

  const rows = recipients.map((recipient) => ({
    template_id: templateId,
    template_snapshot: snapshot,
    template_version: version,
    recipient_name: recipient.name,
    recipient_email: recipient.email?.trim() || null,
    recipient_user_id: recipient.userId || null,
    certificate_title: recipient.title?.trim() || 'Certificate of Achievement',
    description: recipient.description ?? description ?? null,
    achievement: recipient.achievement ?? achievement ?? null,
    issue_date: issueDate || new Date().toISOString().slice(0, 10),
    organization_name: organizationName || template.name,
    organization_logo_url: organizationLogoUrl || null,
    signatory_1_name: signatory1?.name || null,
    signatory_1_title: signatory1?.title || null,
    signatory_1_image_url: signatory1?.imageUrl || null,
    signatory_2_name: signatory2?.name || null,
    signatory_2_title: signatory2?.title || null,
    signatory_2_image_url: signatory2?.imageUrl || null,
    custom_fields: { ...customFields, ...(recipient.customFields || {}) },
    status: 'valid',
    issued_by: issuedBy,
    issue_batch_id: batchId || null,
  }))

  const { data, error } = await supabase.from('certificates').insert(rows).select()
  if (error) throw error

  // The certificate number and verification token are generated by a database
  // trigger, so they cannot be spoofed or predicted from the client.
  await audit(rows.length > 1 ? 'certificate_bulk_issued' : 'certificate_issued', {
    templateId,
    detail: {
      batch_id: batchId || null,
      count: data.length,
      recipients: data.map((c) => ({ id: c.certificate_id, name: c.recipient_name })),
    },
  })

  return data
}

export async function revokeCertificate(certificateUuid, reason) {
  if (!reason?.trim()) throw new Error('A revocation reason is required')
  const { error } = await supabase.rpc('revoke_certificate', {
    p_certificate_id: certificateUuid,
    p_reason: reason.trim(),
  })
  if (error) throw error
  // The audit row is written by revoke_certificate() inside the same
  // transaction, so it cannot drift from the status change.
}

export async function reissueCertificate(oldCertificateUuid, reason, overrides = {}) {
  if (!reason?.trim()) throw new Error('A reason is required to reissue')
  const { data, error } = await supabase.rpc('reissue_certificate', {
    p_old_certificate_id: oldCertificateUuid,
    p_reason: reason.trim(),
    p_overrides: overrides,
  })
  if (error) throw error
  return data
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------
export async function listCertificates({
  search = '',
  status = 'all',
  templateId = 'all',
  dateFrom = '',
  dateTo = '',
  limit = 50,
  offset = 0,
} = {}) {
  let query = supabase.from('certificates').select('*', { count: 'exact' })

  if (status !== 'all') query = query.eq('status', status)
  if (templateId !== 'all') query = query.eq('template_id', templateId)
  if (dateFrom) query = query.gte('issue_date', dateFrom)
  if (dateTo) query = query.lte('issue_date', dateTo)

  const term = search.trim()
  if (term) {
    // Certificate numbers are exact-ish matches; names need a case-insensitive
    // contains. PostgREST or() with ilike covers both.
    const safe = term.replace(/[%,()]/g, ' ')
    query = query.or(
      `recipient_name.ilike.%${safe}%,certificate_id.ilike.%${safe}%,recipient_email.ilike.%${safe}%`
    )
  }

  const { data, error, count } = await query
    .order('issue_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return { rows: data || [], total: count || 0 }
}

export async function getCertificate(uuid) {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', uuid)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createSignedPdfUrl(certificateUuid) {
  const { data: signed, error: signError } = await supabase.storage
    .from(CERTIFICATES_BUCKET)
    .createSignedUrl(`${certificateUuid}.pdf`, 600)
  if (signError) throw signError
  if (!signed?.signedUrl) throw new Error('Could not generate a signed PDF URL')
  return signed.signedUrl
}

export async function fetchCertificateStats() {
  const { data, error } = await supabase.from('certificate_stats').select('*').maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function fetchVerificationEvents({ certificateId, limit = 50 } = {}) {
  let query = supabase
    .from('certificate_verification_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (certificateId) query = query.eq('certificate_id', certificateId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function fetchAuditLogs({ certificateId, templateId, limit = 50 } = {}) {
  let query = supabase
    .from('certificate_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (certificateId) query = query.eq('certificate_id', certificateId)
  if (templateId) query = query.eq('template_id', templateId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------
async function callPdfFunction(certificateUuid, download) {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData?.session?.access_token
  if (!token) throw new Error('You must be signed in to download certificates')

  const response = await fetch(`${FUNCTIONS_BASE}/generate-certificate-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ certificateId: certificateUuid, download }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'Could not generate the PDF')
  return payload
}

export async function openCertificatePdf(certificateUuid) {
  const { url } = await callPdfFunction(certificateUuid, false)
  window.open(url, '_blank', 'noopener')
  return url
}

export async function downloadCertificatePdf(certificateUuid, filename) {
  const { url } = await callPdfFunction(certificateUuid, true)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'certificate.pdf'
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  return url
}

// ---------------------------------------------------------------------------
// Public verification
// ---------------------------------------------------------------------------
/**
 * Public verification. `method` reflects how the user arrived:
 *  - 'verification_url' from /verify/<token> (QR scan or shared link)
 *  - 'qr_code' when the reference came from a scanned QR code
 *  - 'certificate_id' when typed into the form
 *
 * Resolves to the allow-listed certificate object. Throws an Error with
 * `code === 'not_found'` when no certificate matches, so callers can tell a
 * genuine miss apart from a service failure.
 */
export async function verifyCertificate(reference, method = 'certificate_id') {
  const response = await fetch(`${FUNCTIONS_BASE}/verify-certificate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ reference, method }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'Verification is temporarily unavailable')
  if (!payload.found) {
    const error = new Error(payload.error || 'No certificate matches that reference')
    error.code = 'not_found'
    throw error
  }
  return payload.certificate
}

/**
 * Ask the public endpoint for a short-lived PDF link. Called only when a visitor
 * actually requests the PDF, so the download counter stays meaningful. The
 * certificate number is used rather than the token so the page never needs to
 * handle the secret-ish verification token after the initial lookup.
 */
export async function requestPublicCertificatePdf(reference, method = 'certificate_id') {
  const response = await fetch(`${FUNCTIONS_BASE}/verify-certificate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ reference, method, action: 'pdf' }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'The PDF could not be prepared')
  if (!payload.pdf_url) throw new Error('The PDF could not be prepared')
  return payload.pdf_url
}

// ---------------------------------------------------------------------------
// CSV helpers (RFC 4180 compliant quoting)
// ---------------------------------------------------------------------------
function csvEscape(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

export function toCsv(rows, columns) {
  const header = columns.map((c) => csvEscape(c.header)).join(',')
  const body = rows
    .map((row) => columns.map((c) => csvEscape(c.value(row))).join(','))
    .join('\r\n')
  return `${header}\r\n${body}`
}

/** Minimal RFC 4180 parser — handles quoted fields, escaped quotes and CRLF. */
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let i = 0
  const src = text.replace(/^\uFEFF/, '')

  while (i < src.length) {
    const char = src[i]
    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 2; continue }
        inQuotes = false; i++; continue
      }
      field += char; i++; continue
    }
    if (char === '"') { inQuotes = true; i++; continue }
    if (char === ',') { row.push(field); field = ''; i++; continue }
    if (char === '\r') { i++; continue }
    if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue }
    field += char; i++
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function certificatesToCsv(rows) {
  return toCsv(rows, [
    { header: 'Certificate ID', value: (r) => r.certificate_id },
    { header: 'Recipient Name', value: (r) => r.recipient_name },
    { header: 'Recipient Email', value: (r) => r.recipient_email },
    { header: 'Title', value: (r) => r.certificate_title },
    { header: 'Organization', value: (r) => r.organization_name },
    { header: 'Issue Date', value: (r) => r.issue_date },
    { header: 'Status', value: (r) => r.status },
    { header: 'Revoked At', value: (r) => r.revoked_at },
    { header: 'Revocation Reason', value: (r) => r.revocation_reason },
    { header: 'Verification URL', value: (r) => certificateVerifyUrl(r.verification_token) },
    { header: 'Times Verified', value: (r) => r.verification_count },
    { header: 'Times Downloaded', value: (r) => r.download_count },
    { header: 'Last Verified', value: (r) => r.last_verified_at },
    { header: 'Last Downloaded', value: (r) => r.last_downloaded_at },
    { header: 'Version', value: (r) => r.version },
    { header: 'Issued At', value: (r) => r.created_at },
  ])
}

export const CERT_PDF_BUCKET = CERTIFICATES_BUCKET