import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Send, Plus, Trash2, Upload, Download, FileSpreadsheet, CheckCircle2,
  Link2, Loader2, Users, AlertCircle, ChevronDown,
} from 'lucide-react'
import CertificatePreview from '../../components/certificates/CertificatePreview'
import AssetUpload from '../../components/certificates/AssetUpload'
import {
  listTemplates, issueCertificates, certificateVerifyUrl, parseCsv,
  certificateTypeLabel, downloadCsv,
} from '../../lib/certificates'
import { normalizeDesign } from '../../../supabase/functions/generate-certificate-pdf/certificateHtml.js'

const SAMPLE_CSV = `name,email,title,description
Ali Raza,ali@example.com,Frontend Development Bootcamp,"Completed 40 hours of coursework and a capstone project"
Fatima Khan,fatima@example.com,Career Mentorship Programme,"Awarded for outstanding mentorship contributions"
Bilal Ahmed,bilal@example.com,Community Volunteer,"Recognised for 120+ hours of community service"`

/** Maps common header spellings onto our recipient fields. */
const HEADER_ALIASES = {
  name: ['name', 'recipient', 'recipient name', 'full name', 'student', 'student name', 'participant'],
  email: ['email', 'e-mail', 'recipient email', 'mail'],
  title: ['title', 'certificate title', 'award', 'course', 'programme', 'program', 'award title'],
  description: ['description', 'details', 'notes', 'body', 'remarks'],
  achievement: ['achievement', 'result', 'outcome', 'hours'],
}

function normaliseHeader(cell) {
  return String(cell || '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
}

function rowsToRecipients(rows) {
  if (!rows.length) return { recipients: [], errors: ['The file appears to be empty'] }

  const header = rows[0].map(normaliseHeader)
  const columnFor = (field) => header.findIndex((h) => HEADER_ALIASES[field].includes(h))

  // A file with no recognisable header is treated as a single-column name list.
  const nameIndex = columnFor('name')
  if (nameIndex === -1) {
    const recipients = rows
      .map((r) => ({ name: (r[0] || '').trim(), email: '', title: '', description: '', achievement: '' }))
      .filter((r) => r.name)
    return {
      recipients,
      errors: recipients.length
        ? []
        : ['Could not find a name column. Use a header row such as: name,email,title'],
    }
  }

  const emailIndex = columnFor('email')
  const titleIndex = columnFor('title')
  const descriptionIndex = columnFor('description')
  const achievementIndex = columnFor('achievement')

  const errors = []
  const recipients = []
  const seen = new Set()

  rows.slice(1).forEach((row, offset) => {
    const name = (row[nameIndex] || '').trim()
    const rowNumber = offset + 2
    if (!name) return

    const email = emailIndex > -1 ? (row[emailIndex] || '').trim() : ''

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Row ${rowNumber}: "${email}" is not a valid email address`)
    }

    // Duplicate protection inside a single upload batch.
    const key = `${name.toLowerCase()}|${email.toLowerCase()}`
    if (seen.has(key)) {
      errors.push(`Row ${rowNumber}: duplicate entry for ${name} — skipped`)
      return
    }
    seen.add(key)

    recipients.push({
      name,
      email,
      title: titleIndex > -1 ? (row[titleIndex] || '').trim() : '',
      description: descriptionIndex > -1 ? (row[descriptionIndex] || '').trim() : '',
      achievement: achievementIndex > -1 ? (row[achievementIndex] || '').trim() : '',
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

export default function IssueCertificate() {
  const [templates, setTemplates] = useState([])
  const [templateId, setTemplateId] = useState('')
  const [recipients, setRecipients] = useState([
    { name: '', email: '', title: '', description: '', achievement: '' },
  ])
  const [organizationName, setOrganizationName] = useState('Career Radar')
  const [organizationLogoUrl, setOrganizationLogoUrl] = useState('')
  const [signatory1, setSignatory1] = useState({ name: '', title: '', imageUrl: '' })
  const [signatory2, setSignatory2] = useState({ name: '', title: '', imageUrl: '' })
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [issuing, setIssuing] = useState(false)
  const [issued, setIssued] = useState([])
  const [importErrors, setImportErrors] = useState([])
  const [showResults, setShowResults] = useState(false)

  const fileInputRef = useRef(null)
  // Regenerated per batch so a retry after a network blip cannot double-issue.
  const batchIdRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    listTemplates({ includeInactive: false })
      .then((rows) => {
        if (cancelled) return
        setTemplates(rows)
        if (rows.length && !templateId) setTemplateId(rows[0].id)
      })
      .catch((error) => toast.error(error.message || 'Could not load templates'))
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const template = useMemo(
    () => templates.find((t) => t.id === templateId) || null,
    [templates, templateId]
  )

  const validRecipients = useMemo(
    () =>
      recipients
        .map((r) => ({
          ...r,
          name: r.name.trim(),
          email: r.email.trim(),
          title: r.title.trim(),
        }))
        .filter((r) => r.name.length > 0),
    [recipients]
  )

  const validationIssues = useMemo(() => {
    const issues = []
    const badEmails = validRecipients.filter(
      (r) => r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)
    )
    if (badEmails.length) {
      issues.push(
        `${badEmails.length} recipient${badEmails.length === 1 ? ' has' : 's have'} an invalid email address`
      )
    }

    const seen = new Set()
    const duplicates = []
    for (const recipient of validRecipients) {
      const key = `${recipient.name.toLowerCase()}|${recipient.email.toLowerCase()}`
      if (seen.has(key)) duplicates.push(recipient.name)
      seen.add(key)
    }
    if (duplicates.length) {
      issues.push(`Duplicate recipient: ${[...new Set(duplicates)].slice(0, 3).join(', ')}`)
    }
    return issues
  }, [validRecipients])

  const canIssue = !!template && validRecipients.length > 0 && validationIssues.length === 0 && !issuing

  const previewData = useMemo(() => {
    const first = validRecipients[0] || {}
    return {
      certificateId: 'CR-2026-000123',
      verificationUrl:
        typeof window !== 'undefined'
          ? `${window.location.origin}/verify/v_preview000000000000000000000000000000000000000000`
          : 'https://www.career-radar.space/verify/v_preview',
      recipientName: first.name || 'Recipient Full Name',
      certificateTitle: first.title || 'Certificate of Achievement',
      description: first.description || description,
      certificateType: template?.certificate_type,
      organizationName: organizationName || 'Career Radar',
      organizationLogoUrl,
      issueDate,
      signatory1Name: signatory1.name,
      signatory1Title: signatory1.title,
      signatory1Image: signatory1.imageUrl,
      signatory2Name: signatory2.name,
      signatory2Title: signatory2.title,
      signatory2Image: signatory2.imageUrl,
    }
  }, [validRecipients, description, template, organizationName, organizationLogoUrl, issueDate, signatory1, signatory2])

  const updateRecipient = (index, field, value) =>
    setRecipients((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))

  const addRecipient = () =>
    setRecipients((prev) => [...prev, { name: '', email: '', title: '', description: '', achievement: '' }])

  const removeRecipient = (index) =>
    setRecipients((prev) => (prev.length === 1 ? [{ ...prev[0], name: '', email: '', title: '' }] : prev.filter((_, i) => i !== index)))

  function handleCsvFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const { recipients: parsed, errors } = rowsToRecipients(parseCsv(String(event.target.result)))
        setImportErrors(errors)
        if (parsed.length) {
          setRecipients(parsed)
          toast.success(`Imported ${parsed.length} recipient${parsed.length === 1 ? '' : 's'}`)
        } else {
          toast.error('No recipients found in that file')
        }
      } catch {
        toast.error('Could not read that file. Make sure it is a valid CSV.')
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
      const created = await issueCertificates({
        templateId,
        recipients: validRecipients,
        organizationName,
        organizationLogoUrl,
        signatory1,
        signatory2,
        description,
        issueDate,
        batchId: batchIdRef.current,
      })

      batchIdRef.current = null
      setIssued(created)
      setShowResults(true)
      toast.success(
        `${created.length} certificate${created.length === 1 ? '' : 's'} issued successfully`
      )
    } catch (error) {
      toast.error(error.message || 'Issuance failed')
    } finally {
      setIssuing(false)
    }
  }

  function startAnother() {
    setIssued([])
    setShowResults(false)
    setRecipients([{ name: '', email: '', title: '', description: '', achievement: '' }])
  }

  const exportResults = useCallback(() => {
    if (!issued.length) return
    downloadCsv(
      'issued-certificates.csv',
      `Certificate ID,Recipient Name,Recipient Email,Title,Issue Date,Status,Verification URL\r\n${issued
        .map(
          (c) =>
            [c.certificate_id, c.recipient_name, c.recipient_email || '', c.certificate_title, c.issue_date, c.status,
             certificateVerifyUrl(c.verification_token)]
              .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
              .join(',')
        )
        .join('\r\n')}`
    )
  }, [issued])

  // ── Success view ──────────────────────────────────────────────────────────
  if (showResults) {
    return (
      <div className="max-w-4xl">
        <div className="glass-card text-center mb-6">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold mb-1">
            {issued.length} certificate{issued.length === 1 ? '' : 's'} issued
          </h1>
          <p className="text-sm text-muted">
            Each certificate has a unique ID and a public verification link. Share it with the recipient or print the PDF.
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
                <th className="p-3 text-xs font-medium text-muted">Verify at</th>
              </tr>
            </thead>
            <tbody>
              {issued.map((certificate) => (
                <tr key={certificate.id} className="border-b border-border/50">
                  <td className="p-3">
                    <p className="font-medium text-sm">{certificate.recipient_name}</p>
                    {certificate.recipient_email && (
                      <p className="text-xs text-muted">{certificate.recipient_email}</p>
                    )}
                  </td>
                  <td className="p-3 font-mono text-xs">{certificate.certificate_id}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(certificateVerifyUrl(certificate.verification_token))
                        toast.success('Verification link copied')
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-blue-accent hover:underline"
                    >
                      <Link2 size={12} />
                      Copy link
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

  // ── Issue view ────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)] gap-6 items-start">
      <div className="space-y-6 min-w-0">
        <div>
          <h1 className="text-3xl font-bold">Issue Certificate</h1>
          <p className="text-sm text-muted mt-1">
            Pick a template, add recipients, then issue. Every certificate gets its own ID and verification link.
          </p>
        </div>

        {/* 1 — Template */}
        <Section
          title="1. Choose a template"
          description="Only active templates can be used for issuance."
        >
          {templates.length === 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <AlertCircle size={18} className="text-amber-600 shrink-0" />
              <p className="text-sm">
                No active templates yet.{' '}
                <a href="/admin/certificates/templates" className="text-gold font-semibold underline">
                  Create one first
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="relative">
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="input-field appearance-none pr-10"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {certificateTypeLabel(t.certificate_type)}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>
          )}
        </Section>

        {/* 2 — Recipients */}
        <Section
          title={`2. Recipients (${validRecipients.length})`}
          description="Add people one by one, or import a CSV to issue in bulk."
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
                onClick={() => downloadCsv('certificate-recipients-template.csv', SAMPLE_CSV)}
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
                {importErrors.slice(0, 6).map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
                {importErrors.length > 6 && <li>…and {importErrors.length - 6} more</li>}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            {recipients.map((recipient, index) => (
              <div
                key={index}
                className="p-3 rounded-xl border border-border bg-white/40 space-y-2.5"
              >
                <div className="flex gap-2">
                  <input
                    value={recipient.name}
                    onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                    placeholder={`Recipient name ${index + 1}`}
                    className="input-field py-2.5 flex-1"
                    aria-label={`Recipient ${index + 1} name`}
                  />
                  {recipients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRecipient(index)}
                      className="p-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                      aria-label="Remove recipient"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    value={recipient.email}
                    onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                    placeholder="Email (optional)"
                    type="email"
                    className={`input-field py-2.5 text-sm ${
                      recipient.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email)
                        ? 'border-red-400'
                        : ''
                    }`}
                    aria-label={`Recipient ${index + 1} email`}
                  />
                  <input
                    value={recipient.title}
                    onChange={(e) => updateRecipient(index, 'title', e.target.value)}
                    placeholder="Certificate title (optional)"
                    className="input-field py-2.5 text-sm"
                    aria-label={`Recipient ${index + 1} title`}
                  />
                </div>

                {recipients.length <= 3 && (
                  <textarea
                    value={recipient.description}
                    onChange={(e) => updateRecipient(index, 'description', e.target.value)}
                    placeholder="Description shown on the certificate (optional)"
                    className="input-field py-2 text-sm h-16"
                    aria-label={`Recipient ${index + 1} description`}
                  />
                )}
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

          {recipients.length > 3 && (
            <p className="text-xs text-muted mt-2 text-center">
              {recipients.length} recipients queued · description field hidden for bulk entries
            </p>
          )}
        </Section>

        {/* 3 — Issuing details */}
        <Section title="3. Issuing details" description="Applied to every certificate in this batch.">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Issuing organisation</label>
                <input
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="input-field"
                  placeholder="Career Radar"
                />
              </div>
              <div>
                <label className="label">Issue date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="label">Default description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field h-20"
                placeholder="Used when a recipient has no description of their own"
              />
            </div>

            <AssetUpload
              label="Organisation logo"
              value={organizationLogoUrl}
              onChange={setOrganizationLogoUrl}
              previewHeight={44}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-border">
              <div className="space-y-3">
                <p className="text-sm font-semibold">Signatory 1</p>
                <input
                  value={signatory1.name}
                  onChange={(e) => setSignatory1((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Name"
                  className="input-field py-2.5"
                />
                <input
                  value={signatory1.title}
                  onChange={(e) => setSignatory1((s) => ({ ...s, title: e.target.value }))}
                  placeholder="Role / title"
                  className="input-field py-2.5"
                />
                <AssetUpload
                  label="Signature image"
                  value={signatory1.imageUrl}
                  onChange={(url) => setSignatory1((s) => ({ ...s, imageUrl: url }))}
                  previewHeight={36}
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">Signatory 2 (optional)</p>
                <input
                  value={signatory2.name}
                  onChange={(e) => setSignatory2((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Name"
                  className="input-field py-2.5"
                />
                <input
                  value={signatory2.title}
                  onChange={(e) => setSignatory2((s) => ({ ...s, title: e.target.value }))}
                  placeholder="Role / title"
                  className="input-field py-2.5"
                />
                <AssetUpload
                  label="Signature image"
                  value={signatory2.imageUrl}
                  onChange={(url) => setSignatory2((s) => ({ ...s, imageUrl: url }))}
                  previewHeight={36}
                />
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Preview + issue */}
      <div className="xl:sticky xl:top-24 space-y-4">
        <div className="glass-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Preview</p>
            <p className="text-xs text-muted">
              {validRecipients.length > 1 ? 'Showing recipient 1 of many' : 'Final appearance'}
            </p>
          </div>

          {template ? (
            <div className="rounded-xl bg-white p-3">
              <CertificatePreview
                design={normalizeDesign(template.design)}
                values={previewData}
                page={{ size: template.page_size, orientation: template.orientation }}
                showShadow={false}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 rounded-xl border border-dashed border-border text-muted text-sm">
              Select a template to preview
            </div>
          )}
        </div>

        <div className="glass-card">
          {validationIssues.length > 0 && (
            <div className="flex items-start gap-2 mb-3 text-sm text-red-500">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                {validationIssues.map((issue, index) => (
                  <p key={index}>{issue}</p>
                ))}
              </div>
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
            className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {issuing ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Issuing…
              </>
            ) : (
              <>
                <Send size={18} /> Issue {validRecipients.length || ''} certificate
                {validRecipients.length === 1 ? '' : 's'}
              </>
            )}
          </button>

          {templates.length === 0 && (
            <a
              href="/admin/certificates/templates"
              className="block text-center text-xs text-gold hover:underline mt-3"
            >
              Create a template to start issuing
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export { rowsToRecipients, SAMPLE_CSV }