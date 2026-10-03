import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Send, Plus, Trash2, Upload, Download, FileSpreadsheet, CheckCircle2,
  Link2, Loader2, Users, AlertCircle, Award,
} from 'lucide-react'
import CertificateAppreciationPreview from '../../components/certificates/CertificateAppreciationPreview'
import {
  listTemplates, issueCertificates, certificateVerifyUrl, parseCsv,
  downloadCsv,
} from '../../lib/certificates'

const SAMPLE_CSV = `name,email,department
Ali Raza,ali@example.com,Design & Branding
Fatima Khan,fatima@example.com,Community Management
Bilal Ahmed,bilal@example.com,Content & Media`

const HEADER_ALIASES = {
  name: ['name', 'recipient', 'recipient name', 'full name'],
  email: ['email', 'e-mail', 'recipient email', 'mail'],
  department: ['department', 'team', 'dept', 'division', 'department name', 'team name'],
}

function normaliseHeader(cell) {
  return String(cell || '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
}

function parseCsvRows(rows) {
  if (!rows.length) return { recipients: [], errors: ['The file appears to be empty'] }
  const header = rows[0].map(normaliseHeader)
  const col = (field) => header.findIndex((h) => HEADER_ALIASES[field].includes(h))
  const nameIdx = col('name')
  if (nameIdx === -1) {
    const recipients = rows.map((r) => ({ name: (r[0] || '').trim(), email: '', department: '' })).filter((r) => r.name)
    return { recipients, errors: recipients.length ? [] : ['Could not find a name column.'] }
  }
  const emailIdx = col('email')
  const deptIdx  = col('department')
  const errors = []
  const seen = new Set()
  const recipients = []
  rows.slice(1).forEach((row, offset) => {
    const name = (row[nameIdx] || '').trim()
    if (!name) return
    const email = emailIdx > -1 ? (row[emailIdx] || '').trim() : ''
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Row ${offset + 2}: "${email}" is not a valid email`)
    }
    const key = `${name.toLowerCase()}|${email.toLowerCase()}`
    if (seen.has(key)) { errors.push(`Row ${offset + 2}: duplicate — skipped`); return }
    seen.add(key)
    recipients.push({
      name,
      email,
      department: deptIdx > -1 ? (row[deptIdx] || '').trim() : '',
    })
  })
  if (!recipients.length) errors.push('No valid recipient rows found')
  return { recipients, errors }
}

function Section({ title, description, children, action }) {
  return (
    <section className="glass-card">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="font-bold text-lg">{title}</h2>
          {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

const CR_APPRECIATION_TEMPLATE_NAME = 'Career Radar Certificate of Appreciation'

export default function IssueCertificateAppreciation() {
  const [templates, setTemplates]   = useState([])
  const [templateId, setTemplateId] = useState('')
  const [issueDate, setIssueDate]   = useState(new Date().toISOString().slice(0, 10))
  const [issuing, setIssuing]       = useState(false)
  const [issued, setIssued]         = useState([])
  const [showResults, setShowResults] = useState(false)
  const [importErrors, setImportErrors] = useState([])

  const [recipients, setRecipients] = useState([
    { name: '', email: '', department: '' },
  ])

  const fileInputRef = useRef(null)
  const batchIdRef   = useRef(null)

  // Load only the CR Appreciation template
  useEffect(() => {
    let cancelled = false
    listTemplates({ includeInactive: false })
      .then((rows) => {
        if (cancelled) return
        setTemplates(rows)
        // Auto-select the Career Radar Appreciation template
        const appreciation = rows.find(
          (t) => t.name.toLowerCase().includes('appreciation') || t.certificate_type === 'appreciation'
        )
        if (appreciation) setTemplateId(appreciation.id)
        else if (rows.length) setTemplateId(rows[0].id)
      })
      .catch((err) => toast.error(err.message || 'Could not load templates'))
    return () => { cancelled = true }
  }, [])

  const template = useMemo(() => templates.find((t) => t.id === templateId) || null, [templates, templateId])

  const validRecipients = useMemo(
    () => recipients.map((r) => ({ ...r, name: r.name.trim(), email: r.email.trim() })).filter((r) => r.name.length > 0),
    [recipients]
  )

  const validationIssues = useMemo(() => {
    const issues = []
    const badEmails = validRecipients.filter((r) => r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email))
    if (badEmails.length) issues.push(`${badEmails.length} recipient(s) have an invalid email`)
    return issues
  }, [validRecipients])

  const canIssue = !!template && validRecipients.length > 0 && validationIssues.length === 0 && !issuing

  // Preview uses first recipient's data (or defaults)
  const previewRecipient = validRecipients[0] || {}

  const updateRecipient = (i, field, value) =>
    setRecipients((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  const addRecipient = () => setRecipients((prev) => [...prev, { name: '', email: '', department: '' }])
  const removeRecipient = (i) =>
    setRecipients((prev) =>
      prev.length === 1 ? [{ ...prev[0], name: '', email: '', department: '' }] : prev.filter((_, idx) => idx !== i)
    )

  function handleCsvFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const { recipients: parsed, errors } = parseCsvRows(parseCsv(String(e.target.result)))
        setImportErrors(errors)
        if (parsed.length) {
          setRecipients(parsed)
          toast.success(`Imported ${parsed.length} recipient${parsed.length === 1 ? '' : 's'}`)
        } else {
          toast.error('No recipients found in that file')
        }
      } catch {
        toast.error('Could not read that file')
      }
    }
    reader.onerror = () => toast.error('Could not read that file')
    reader.readAsText(file)
  }

  async function handleIssue() {
    if (!canIssue) return
    if (!batchIdRef.current) batchIdRef.current = crypto.randomUUID()
    setIssuing(true)
    try {
      const recipientPayloads = validRecipients.map((r) => ({
        name: r.name,
        email: r.email,
        title: 'Certificate of Appreciation',
        customFields: { department_name: r.department || '' },
      }))

      const created = await issueCertificates({
        templateId,
        recipients: recipientPayloads,
        organizationName: 'Career Radar',
        issueDate,
        batchId: batchIdRef.current,
      })

      batchIdRef.current = null
      setIssued(created)
      setShowResults(true)
      toast.success(`${created.length} certificate${created.length === 1 ? '' : 's'} issued`)
    } catch (err) {
      toast.error(err.message || 'Issuance failed')
    } finally {
      setIssuing(false)
    }
  }

  function startAnother() {
    setIssued([])
    setShowResults(false)
    setRecipients([{ name: '', email: '', department: '' }])
  }

  const exportResults = useCallback(() => {
    if (!issued.length) return
    downloadCsv(
      'issued-appreciation-certificates.csv',
      `Certificate ID,Recipient Name,Recipient Email,Department,Issue Date,Status,Verification URL\r\n${issued
        .map((c) =>
          [c.certificate_id, c.recipient_name, c.recipient_email || '', (c.custom_fields || {}).department_name || '', c.issue_date, c.status, certificateVerifyUrl(c.verification_token)]
            .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
            .join(',')
        )
        .join('\r\n')}`
    )
  }, [issued])

  // ── Success view ─────────────────────────────────────────────────────────
  if (showResults) {
    return (
      <div className="max-w-4xl">
        <div className="glass-card text-center mb-6">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold mb-1">
            {issued.length} certificate{issued.length === 1 ? '' : 's'} issued
          </h1>
          <p className="text-sm text-muted">
            Each certificate has a unique ID and a public verification link.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <button type="button" onClick={exportResults} className="btn-ghost text-sm px-4 py-2 inline-flex items-center gap-2">
              <Download size={15} /> Export CSV
            </button>
            <button type="button" onClick={startAnother} className="btn-primary text-sm px-4 py-2">
              Issue more certificates
            </button>
          </div>
        </div>

        <div className="glass-card overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="p-3 text-xs font-medium text-muted">Recipient</th>
                <th className="p-3 text-xs font-medium text-muted">Certificate ID</th>
                <th className="p-3 text-xs font-medium text-muted">Department</th>
                <th className="p-3 text-xs font-medium text-muted">Verify at</th>
              </tr>
            </thead>
            <tbody>
              {issued.map((c) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="p-3">
                    <p className="font-medium text-sm">{c.recipient_name}</p>
                    {c.recipient_email && <p className="text-xs text-muted">{c.recipient_email}</p>}
                  </td>
                  <td className="p-3 font-mono text-xs">{c.certificate_id}</td>
                  <td className="p-3 text-xs">{(c.custom_fields || {}).department_name || '—'}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(certificateVerifyUrl(c.verification_token))
                        toast.success('Verification link copied')
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-blue-accent hover:underline"
                    >
                      <Link2 size={12} /> Copy link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── Issue view ─────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)] gap-6 items-start">
      <div className="space-y-6 min-w-0">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gold/10">
              <Award size={22} className="text-gold" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Issue Appreciation Certificate</h1>
              <p className="text-sm text-muted mt-0.5">
                Official Career Radar Certificate of Appreciation for volunteers.
              </p>
            </div>
          </div>
        </div>

        {/* Template selector — only shown if multiple templates exist */}
        {templates.length > 1 && (
          <Section title="Template" description="Select the certificate template to use.">
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="input-field"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Section>
        )}

        {templates.length === 0 && (
          <div className="glass-card flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <p className="text-sm">
              No active templates found.{' '}
              <a href="/admin/certificates/templates" className="text-gold font-semibold underline">Create one first</a>.
            </p>
          </div>
        )}

        {/* Recipients */}
        <Section
          title={`Recipients (${validRecipients.length})`}
          description="Add recipients individually or import a CSV with name, email, department columns."
          action={
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => handleCsvFile(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-ghost text-xs px-3 py-2 inline-flex items-center gap-1.5"
              >
                <Upload size={14} /> Import CSV
              </button>
              <button
                type="button"
                onClick={() => downloadCsv('appreciation-template.csv', SAMPLE_CSV)}
                className="p-2 rounded-lg hover:bg-black/5 transition-colors text-muted"
                title="Download CSV template"
              >
                <FileSpreadsheet size={16} />
              </button>
            </div>
          }
        >
          {importErrors.length > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <p className="text-sm font-semibold text-amber-700 mb-1">Import notes</p>
              <ul className="text-xs text-amber-700/90 space-y-0.5 list-disc pl-4">
                {importErrors.slice(0, 6).map((msg, i) => <li key={i}>{msg}</li>)}
                {importErrors.length > 6 && <li>…and {importErrors.length - 6} more</li>}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            {recipients.map((r, i) => (
              <div key={i} className="p-3 rounded-xl border border-border bg-white/40 space-y-2.5">
                <div className="flex gap-2">
                  <input
                    value={r.name}
                    onChange={(e) => updateRecipient(i, 'name', e.target.value)}
                    placeholder={`Full name ${i + 1}`}
                    className="input-field py-2.5 flex-1"
                    aria-label={`Recipient ${i + 1} name`}
                  />
                  {recipients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRecipient(i)}
                      className="p-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                      aria-label="Remove recipient"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    value={r.email}
                    onChange={(e) => updateRecipient(i, 'email', e.target.value)}
                    placeholder="Email (optional)"
                    type="email"
                    className={`input-field py-2.5 text-sm ${
                      r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email) ? 'border-red-400' : ''
                    }`}
                    aria-label={`Recipient ${i + 1} email`}
                  />
                  <input
                    value={r.department}
                    onChange={(e) => updateRecipient(i, 'department', e.target.value)}
                    placeholder="Department / team name"
                    className="input-field py-2.5 text-sm"
                    aria-label={`Recipient ${i + 1} department`}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRecipient}
            className="mt-3 w-full btn-ghost text-sm py-2.5 inline-flex items-center justify-center gap-2"
          >
            <Plus size={15} /> Add recipient
          </button>
        </Section>

        {/* Issue date */}
        <Section title="Issue Date" description="The date printed on the certificate.">
          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="input-field"
          />
        </Section>
      </div>

      {/* Preview + issue panel */}
      <div className="xl:sticky xl:top-24 space-y-4">
        <div className="glass-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Live Preview</p>
            <p className="text-xs text-muted">
              {validRecipients.length > 1 ? 'Showing recipient 1 of many' : 'Official design'}
            </p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <CertificateAppreciationPreview
              certificateId="CR-VOL-2026-001"
              recipientName={previewRecipient.name || 'Recipient Name'}
              departmentName={previewRecipient.department || 'Department / Team'}
              issueDate={issueDate}
              verificationUrl="https://www.career-radar.space/verify/preview"
              showShadow={false}
            />
          </div>
        </div>

        <div className="glass-card">
          {validationIssues.length > 0 && (
            <div className="flex items-start gap-2 mb-3 text-sm text-red-500">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>{validationIssues.map((issue, i) => <p key={i}>{issue}</p>)}</div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm mb-4">
            <span className="inline-flex items-center gap-2 text-muted">
              <Users size={15} />
              {validRecipients.length} recipient{validRecipients.length === 1 ? '' : 's'}
            </span>
            <span className="text-muted">ID + QR generated automatically</span>
          </div>

          <button
            type="button"
            onClick={handleIssue}
            disabled={!canIssue}
            className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {issuing ? (
              <><Loader2 size={18} className="animate-spin" /> Issuing…</>
            ) : (
              <><Send size={18} /> Issue {validRecipients.length || ''} certificate{validRecipients.length === 1 ? '' : 's'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
