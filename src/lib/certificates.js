import { supabase } from './supabase'
import { parseCertificateReference } from './certificateReference'
import {
  renderCertificateHtml,
  renderCareerRadarAppreciationHtml,
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

/**
 * Direct client-side print and vector PDF view.
 * Renders the full, uncompressed, official Career Radar certificate
 * with A4 Landscape page dimensions and triggers the browser's native PDF save dialog.
 * This completely avoids server-side Chromium / headless browser runtime issues.
 */
export async function openCertificatePrintView(certificateRecord, autoPrint = false) {
  // Open window immediately on user gesture to avoid popup blockers
  let win = null
  try {
    win = window.open('about:blank', '_blank')
    if (win) {
      win.document.write('<!DOCTYPE html><html><head><title>Career Radar Certificate</title></head><body style="margin:0;background:#07122A;display:flex;align-items:center;justify-content:center;height:100vh;color:#C9993C;font-family:Inter,sans-serif;"><h3>Preparing official certificate...</h3></body></html>')
    }
  } catch {}

  let cert = certificateRecord
  if (typeof cert === 'string') {
    try {
      const { data } = await supabase
        .from('certificates')
        .select('*')
        .or(`id.eq.${cert},certificate_id.eq.${cert},verification_token.eq.${cert}`)
        .maybeSingle()
      cert = data
    } catch {}
  }

  if (!cert) {
    if (win) win.close()
    throw new Error('Certificate record could not be loaded for print view')
  }

  const verifyUrl = certificateVerifyUrl(cert.verification_token)
  const certId = cert.certificate_id || ''
  const recipientName = cert.recipient_name || 'Recipient'
  const departmentName = cert.custom_fields?.department_name || cert.achievement || 'Career Radar'
  const certTitle = cert.certificate_title || 'Certificate of Appreciation'
  const certType = cert.custom_fields?.certificate_type || cert.template_snapshot?.certificate_type || ''
  const desc = cert.description || ''
  const achieve = cert.achievement || ''
  const issueDate = cert.issue_date || ''
  const sigName = cert.signatory_1_name || 'HASNAIN SHAKEEL AHMED'
  const sigTitle = cert.signatory_1_title || 'FOUNDER & CEO'
  const sigImage = cert.signatory_1_image_url || ''

  const rawHtml = renderCareerRadarAppreciationHtml({
    certificateId: certId,
    recipientName,
    departmentName,
    certificateTitle: certTitle,
    certificateType: certType,
    description: desc,
    achievement: achieve,
    issueDate,
    verificationUrl: verifyUrl,
    signatory1Name: sigName,
    signatory1Title: sigTitle,
    signatory1Image: sigImage,
  })

  const toolbar = `
    <div class="cr-toolbar-print" style="position: fixed; top: 16px; right: 24px; z-index: 999999; display: flex; align-items: center; gap: 10px; background: rgba(11,27,61,0.96); padding: 8px 16px; border-radius: 12px; border: 1.5px solid #C9A227; box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-family: Inter, sans-serif;">
      <button onclick="window.print()" style="background: #C9A227; color: #0B1B3D; border: none; font-weight: 700; font-size: 13px; padding: 8px 16px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
        🖨️ Save as PDF / Print
      </button>
      <button onclick="window.close()" style="background: rgba(255,255,255,0.1); color: #FFF; border: none; font-size: 13px; padding: 8px 14px; border-radius: 8px; cursor: pointer;">
        ✕ Close
      </button>
    </div>
    <style>
      @media print {
        .cr-toolbar-print { display: none !important; }
        @page { size: A4 landscape; margin: 0; }
        body { margin: 0 !important; padding: 0 !important; background: white !important; }
      }
    </style>
    ${autoPrint ? '<script>window.addEventListener("load", () => setTimeout(() => window.print(), 400));</script>' : ''}
  `

  const finalHtml = rawHtml.replace('</body>', `${toolbar}</body>`)

  if (win && !win.closed) {
    win.document.open()
    win.document.write(finalHtml)
    win.document.close()
    if (autoPrint) {
      setTimeout(() => {
        try { win.focus(); win.print(); } catch {}
      }, 500)
    }
    return true
  }

  // Blob URL fallback if initial window.open was blocked by the browser
  const blob = new Blob([finalHtml], { type: 'text/html' })
  const blobUrl = URL.createObjectURL(blob)

  try {
    const fallbackWin = window.open(blobUrl, '_blank')
    if (fallbackWin) return true
  } catch {}

  // Fallback: iframe print or direct link navigation
  try {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)
    iframe.src = blobUrl
    iframe.onload = () => {
      if (autoPrint) {
        try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch {}
      }
      setTimeout(() => iframe.remove(), 60000)
    }
    return true
  } catch {
    const link = document.createElement('a')
    link.href = blobUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.click()
    return true
  }
}

export async function openCertificatePdf(certificateUuid) {
  // If static PDF is already stored in storage bucket, open signed URL
  const cert = typeof certificateUuid === 'object' ? certificateUuid : null
  if (cert?.pdf_path) {
    try {
      const { data: signed } = await supabase.storage
        .from(CERTIFICATES_BUCKET)
        .createSignedUrl(cert.pdf_path, 300)

      if (signed?.signedUrl) {
        window.open(signed.signedUrl, '_blank', 'noopener')
        return signed.signedUrl
      }
    } catch {}
  }

  return openCertificatePrintView(certificateUuid, false)
}

export async function downloadCertificatePdf(certificateUuid, filename) {
  // If static PDF is already stored in storage bucket, download signed URL
  const cert = typeof certificateUuid === 'object' ? certificateUuid : null
  if (cert?.pdf_path) {
    try {
      const { data: signed } = await supabase.storage
        .from(CERTIFICATES_BUCKET)
        .createSignedUrl(cert.pdf_path, 300, { download: `${cert.certificate_id || 'certificate'}.pdf` })

      if (signed?.signedUrl) {
        window.open(signed.signedUrl, '_blank')
        return signed.signedUrl
      }
    } catch {}
  }

  // Fallback: trigger landscape vector print to PDF
  return openCertificatePrintView(certificateUuid, true)
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
  const normRef = String(reference || '').trim()
  if (!normRef) {
    const error = new Error('Enter a certificate ID or scan a certificate QR code')
    error.code = 'not_found'
    throw error
  }

  // 1. Try Supabase direct RPC first (fast, direct to PostgreSQL, avoids 503 Edge Function timeouts)
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('public_verify_certificate', {
      p_reference: normRef,
      p_method: method,
    })

    if (!rpcError && rpcData) {
      if (!rpcData.found) {
        const error = new Error('No certificate matches that reference. Please check the ID and try again.')
        error.code = 'not_found'
        throw error
      }
      return rpcData
    }
  } catch (err) {
    if (err.code === 'not_found') throw err
    console.warn('public_verify_certificate RPC error, trying edge function / direct query:', err)
  }

  // 2. Try Edge Function
  try {
    const response = await fetch(`${FUNCTIONS_BASE}/verify-certificate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ reference: normRef, method }),
    })
    if (response.ok) {
      const payload = await response.json().catch(() => ({}))
      if (payload.found && payload.certificate) {
        return payload.certificate
      }
      if (payload.found === false) {
        const error = new Error(payload.error || 'No certificate matches that reference')
        error.code = 'not_found'
        throw error
      }
    }
  } catch (err) {
    if (err.code === 'not_found') throw err
    console.warn('Edge function verify failed, trying table fallback:', err)
  }

  // 3. Fallback: Direct table query (works if user is authenticated admin, recipient, or public policy is enabled)
  try {
    const isByToken = method === 'verification_url' || method === 'qr_code'
    const col = isByToken ? 'verification_token' : 'certificate_id'
    const val = isByToken ? normRef.toLowerCase() : normRef.toUpperCase()

    let { data: located, error: tableError } = await supabase
      .from('certificates')
      .select('*')
      .eq(col, val)
      .maybeSingle()

    if (!located) {
      const altCol = isByToken ? 'certificate_id' : 'verification_token'
      const altVal = isByToken ? normRef.toUpperCase() : normRef.toLowerCase()
      const { data: altLocated } = await supabase
        .from('certificates')
        .select('*')
        .eq(altCol, altVal)
        .maybeSingle()
      if (altLocated) located = altLocated
    }

    if (!tableError && located) {
      return {
        found: true,
        id: located.id,
        certificate_id: located.certificate_id,
        verification_token: located.verification_token,
        recipient_name: located.recipient_name,
        certificate_title: located.certificate_title,
        description: located.description,
        achievement: located.achievement,
        certificate_type: located.custom_fields?.certificate_type || located.template_snapshot?.certificate_type || 'appreciation',
        issue_date: located.issue_date,
        organization_name: located.organization_name || 'Career Radar',
        organization_logo_url: located.organization_logo_url,
        signatory_1_name: located.signatory_1_name,
        signatory_1_title: located.signatory_1_title,
        signatory_1_image_url: located.signatory_1_image_url,
        signatory_2_name: located.signatory_2_name,
        signatory_2_title: located.signatory_2_title,
        signatory_2_image_url: located.signatory_2_image_url,
        template_snapshot: located.template_snapshot,
        pdf_path: located.pdf_path,
        status: located.status,
        revoked_at: located.revoked_at,
        revocation_reason: located.revocation_reason,
        custom_fields: located.custom_fields || {},
        verification_count: (located.verification_count || 0) + 1,
        last_verified_at: new Date().toISOString(),
      }
    }
  } catch (err) {
    console.warn('Direct query fallback error:', err)
  }

  const notFound = new Error('No certificate matches that reference. Please check the ID and try again.')
  notFound.code = 'not_found'
  throw notFound
}

/**
 * Ask for a short-lived PDF link with Edge Function + Storage fallback.
 */
export async function requestPublicCertificatePdf(reference, method = 'certificate_id') {
  // 1. Try Edge function
  try {
    const response = await fetch(`${FUNCTIONS_BASE}/verify-certificate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ reference, method, action: 'pdf' }),
    })
    if (response.ok) {
      const payload = await response.json().catch(() => ({}))
      if (payload.pdf_url) return payload.pdf_url
    }
  } catch (err) {
    console.warn('Edge function PDF request failed, falling back:', err)
  }

  // 2. Direct storage lookup fallback
  const isByToken = method === 'verification_url' || method === 'qr_code'
  const col = isByToken ? 'verification_token' : 'certificate_id'
  const val = isByToken ? reference.toLowerCase() : reference.toUpperCase()

  const { data: cert } = await supabase
    .from('certificates')
    .select('id, pdf_path, status')
    .eq(col, val)
    .maybeSingle()

  if (cert?.pdf_path) {
    const { data: signed } = await supabase.storage
      .from('certificate-pdfs')
      .createSignedUrl(cert.pdf_path, 600)
    if (signed?.signedUrl) return signed.signedUrl
  }

  throw new Error('A PDF copy is not available yet for this certificate.')
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