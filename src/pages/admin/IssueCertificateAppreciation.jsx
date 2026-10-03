import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Send, Plus, Trash2, Upload, Download, FileSpreadsheet, CheckCircle2,
  Link2, Loader2, Users, AlertCircle, Award, Sparkles, GraduationCap,
  Briefcase, Trophy, Globe,
} from 'lucide-react'
import CertificateAppreciationPreview from '../../components/certificates/CertificateAppreciationPreview'
import {
  listTemplates, issueCertificates, certificateVerifyUrl, parseCsv,
  downloadCsv,
} from '../../lib/certificates'

const CERT_TYPES = [
  { id: 'completion', label: 'Completion', icon: GraduationCap, defaultTitle: 'Certificate of Completion', placeholderDept: 'Full Stack Development / Course' },
  { id: 'internship', label: 'Internship', icon: Briefcase, defaultTitle: 'Certificate of Internship', placeholderDept: 'Software Engineering Team' },
  { id: 'achievement', label: 'Achievement', icon: Trophy, defaultTitle: 'Certificate of Achievement', placeholderDept: 'Leadership & Innovation' },
  { id: 'participation', label: 'Participation', icon: Globe, defaultTitle: 'Certificate of Participation', placeholderDept: 'Annual Hackathon / Workshop' },
  { id: 'appreciation', label: 'Appreciation', icon: Award, defaultTitle: 'Certificate of Appreciation', placeholderDept: 'Volunteer Community Team' },
  { id: 'custom', label: 'Custom', icon: Sparkles, defaultTitle: 'Certificate of Recognition', placeholderDept: 'Department or Program' },
]

const SAMPLE_CSV = `name,email,department,achievement
Ali Raza,ali@example.com,Full Stack Development,Grade A+ (Distinction)
Fatima Khan,fatima@example.com,Community Management,120+ Volunteer Hours
Bilal Ahmed,bilal@example.com,Design & Media,Excellence Award`

const HEADER_ALIASES = {
  name: ['name', 'recipient', 'recipient name', 'full name', 'student'],
  email: ['email', 'e-mail', 'recipient email', 'mail'],
  department: ['department', 'team', 'dept', 'division', 'department name', 'team name', 'course', 'program', 'track'],
  achievement: ['achievement', 'grade', 'honors', 'score', 'result'],
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
    const recipients = rows.map((r) => ({ name: (r[0] || '').trim(), email: '', department: '', achievement: '' })).filter((r) => r.name)
    return { recipients, errors: recipients.length ? [] : ['Could not find a name column.'] }
  }
  const emailIdx = col('email')
  const deptIdx  = col('department')
  const achieveIdx = col('achievement')
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
      achievement: achieveIdx > -1 ? (row[achieveIdx] || '').trim() : '',
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
          <h2 className="font-bold text-lg text-white">{title}</h2>
          {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function IssueCertificateAppreciation() {
  const [templates, setTemplates]   = useState([])
  const [templateId, setTemplateId] = useState('')
  const [certType, setCertType]     = useState('completion')
  const [customTitle, setCustomTitle] = useState('Certificate of Completion')
  const [customDescription, setCustomDescription] = useState('')
  const [defaultDepartment, setDefaultDepartment] = useState('')
  const [defaultAchievement, setDefaultAchievement] = useState('')
  const [signatory1Name, setSignatory1Name] = useState('HASNAIN SHAKEEL AHMED')
  const [signatory1Title, setSignatory1Title] = useState('FOUNDER & CEO')
  const [issueDate, setIssueDate]   = useState(new Date().toISOString().slice(0, 10))
  const [issuing, setIssuing]       = useState(false)
  const [issued, setIssued]         = useState([])
  const [showResults, setShowResults] = useState(false)
  const [importErrors, setImportErrors] = useState([])

  const [recipients, setRecipients] = useState([
    { name: '', email: '', department: '', achievement: '' },
  ])

  const fileInputRef = useRef(null)
  const batchIdRef   = useRef(null)

  useEffect(() => {
    let cancelled = false
    listTemplates({ includeInactive: false })
      .then((rows) => {
        if (cancelled) return
        setTemplates(rows)
        const match = rows.find(
          (t) => t.name.toLowerCase().includes(certType) || t.certificate_type === certType
        )
        if (match) setTemplateId(match.id)
        else if (rows.length) setTemplateId(rows[0].id)
      })
      .catch((err) => toast.error(err.message || 'Could not load templates'))
    return () => { cancelled = true }
  }, [certType])

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

  const canIssue = (!!template || templates.length > 0) && validRecipients.length > 0 && validationIssues.length === 0 && !issuing

  const previewRecipient = validRecipients[0] || {}

  const updateRecipient = (i, field, value) =>
    setRecipients((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  const addRecipient = () => setRecipients((prev) => [...prev, { name: '', email: '', department: '', achievement: '' }])
  const removeRecipient = (i) =>
    setRecipients((prev) =>
      prev.length === 1 ? [{ ...prev[0], name: '', email: '', department: '', achievement: '' }] : prev.filter((_, idx) => idx !== i)
    )

  function handleTypeChange(typeId) {
    setCertType(typeId)
    const match = CERT_TYPES.find((t) => t.id === typeId)
    if (match) {
      setCustomTitle(match.defaultTitle)
    }
  }

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
      const activeTemplateId = templateId || (templates[0]?.id)
      const recipientPayloads = validRecipients.map((r) => ({
        name: r.name,
        email: r.email,
        title: customTitle || 'Certificate of Completion',
        description: customDescription || '',
        achievement: r.achievement || defaultAchievement || '',
        customFields: {
          department_name: r.department || defaultDepartment || '',
          certificate_type: certType,
        },
      }))

      const created = await issueCertificates({
        templateId: activeTemplateId,
        recipients: recipientPayloads,
        organizationName: 'Career Radar',
        signatory1: { name: signatory1Name, title: signatory1Title },
        achievement: defaultAchievement || '',
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
    setRecipients([{ name: '', email: '', department: '', achievement: '' }])
  }

  const exportResults = useCallback(() => {
    if (!issued.length) return
    downloadCsv(
      'issued-certificates.csv',
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
          <h1 className="text-2xl font-bold mb-1 text-white">
            {issued.length} certificate{issued.length === 1 ? '' : 's'} issued
          </h1>
          <p className="text-sm text-muted">
            Each certificate has a unique ID and a live public verification link.
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
                <th className="p-3 text-xs font-medium text-muted">Verify link</th>
              </tr>
            </thead>
            <tbody>
              {issued.map((c) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="p-3">
                    <p className="font-medium text-sm text-white">{c.recipient_name}</p>
                    {c.recipient_email && <p className="text-xs text-muted">{c.recipient_email}</p>}
                  </td>
                  <td className="p-3 font-mono text-xs text-slate-300">{c.certificate_id}</td>
                  <td className="p-3 text-xs text-slate-300">{(c.custom_fields || {}).department_name || '—'}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(certificateVerifyUrl(c.verification_token))
                        toast.success('Verification link copied')
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline"
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
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,540px)] gap-6 items-start">
      <div className="space-y-6 min-w-0">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20">
              <Award size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Issue Official Certificate</h1>
              <p className="text-sm text-muted mt-0.5">
                Generate official Career Radar Certificates for volunteers, course graduates, interns, or participants.
              </p>
            </div>
          </div>
        </div>

        {/* ── Certificate Type Selection ── */}
        <Section title="Certificate Type" description="Choose the purpose of this award. Layout automatically tailors to this type.">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CERT_TYPES.map((t) => {
              const Icon = t.icon
              const active = certType === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTypeChange(t.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                    active
                      ? 'border-gold bg-gold/10 text-gold font-semibold shadow-sm'
                      : 'border-white/10 hover:border-white/20 text-slate-300 hover:text-white bg-white/[0.02]'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-gold' : 'text-slate-400'} />
                  <span className="text-xs">{t.label}</span>
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/[0.06]">
            <div>
              <label className="label">Certificate Title</label>
              <input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Certificate of Completion"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Department / Track / Program</label>
              <input
                value={defaultDepartment}
                onChange={(e) => setDefaultDepartment(e.target.value)}
                placeholder={CERT_TYPES.find((t) => t.id === certType)?.placeholderDept || 'e.g. Full Stack Web Development'}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Achievement / Honors <span className="text-xs text-muted font-normal">(Optional)</span></label>
              <input
                value={defaultAchievement}
                onChange={(e) => setDefaultAchievement(e.target.value)}
                placeholder="e.g. Grade A+ (Distinction), 120 Hours"
                className="input-field"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="label">
              Custom Recognition Statement <span className="text-xs text-muted font-normal">(Optional — overrides default text)</span>
            </label>
            <textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Leave empty to use official standard recognition statement, or enter custom wording..."
              rows={2}
              className="input-field h-20 text-sm"
            />
          </div>
        </Section>

        {/* Signatory & Date */}
        <Section title="Signatory & Issue Date" description="Authority credentials and issue date on the certificate.">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Signatory Name</label>
              <input
                value={signatory1Name}
                onChange={(e) => setSignatory1Name(e.target.value)}
                placeholder="HASNAIN SHAKEEL AHMED"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Signatory Title</label>
              <input
                value={signatory1Title}
                onChange={(e) => setSignatory1Title(e.target.value)}
                placeholder="FOUNDER & CEO"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </Section>

        {/* Recipients */}
        <Section
          title={`Recipients (${validRecipients.length})`}
          description="Add recipients individually or import a CSV file."
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
                onClick={() => downloadCsv('career-radar-recipients.csv', SAMPLE_CSV)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted"
                title="Download CSV template"
              >
                <FileSpreadsheet size={16} />
              </button>
            </div>
          }
        >
          {importErrors.length > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <p className="text-sm font-semibold text-amber-500 mb-1">Import notes</p>
              <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                {importErrors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            {recipients.map((r, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center">
                <input
                  value={r.name}
                  onChange={(e) => updateRecipient(i, 'name', e.target.value)}
                  placeholder="Full name *"
                  className="input-field flex-1"
                />
                <input
                  type="email"
                  value={r.email}
                  onChange={(e) => updateRecipient(i, 'email', e.target.value)}
                  placeholder="Email (optional)"
                  className="input-field flex-1"
                />
                <input
                  value={r.department}
                  onChange={(e) => updateRecipient(i, 'department', e.target.value)}
                  placeholder={defaultDepartment || 'Department / Track'}
                  className="input-field flex-1"
                />
                <input
                  value={r.achievement || ''}
                  onChange={(e) => updateRecipient(i, 'achievement', e.target.value)}
                  placeholder="Achievement (optional)"
                  className="input-field flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeRecipient(i)}
                  className="p-2.5 rounded-lg hover:bg-red-500/20 text-muted hover:text-red-400 transition-colors self-center"
                  title="Remove recipient"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRecipient}
            className="mt-4 text-xs font-semibold text-gold hover:underline inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Add another recipient
          </button>
        </Section>
      </div>

      {/* ── Sticky Right Column: Live Preview & Action ── */}
      <div className="xl:sticky xl:top-20 space-y-4">
        <div className="glass-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">Live Official Preview</p>
            <p className="text-xs text-muted">
              {validRecipients.length > 1 ? 'Showing recipient 1 of many' : 'Exact client layout'}
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.02] border border-white/10 p-2 overflow-hidden">
            <CertificateAppreciationPreview
              certificateId="CR-2026-001"
              recipientName={previewRecipient.name || 'Recipient Name'}
              departmentName={previewRecipient.department || defaultDepartment || 'Department / Team'}
              certificateTitle={customTitle}
              certificateType={certType}
              description={customDescription}
              achievement={previewRecipient.achievement || defaultAchievement}
              issueDate={issueDate}
              signatory1Name={signatory1Name}
              signatory1Title={signatory1Title}
              verificationUrl="https://www.career-radar.space/verify/preview"
              showShadow={false}
            />
          </div>
        </div>

        <div className="glass-card">
          {validationIssues.length > 0 && (
            <div className="flex items-start gap-2 mb-3 text-sm text-red-400">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>{validationIssues.map((issue, i) => <p key={i}>{issue}</p>)}</div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm mb-4">
            <span className="inline-flex items-center gap-2 text-muted">
              <Users size={15} />
              {validRecipients.length} recipient{validRecipients.length === 1 ? '' : 's'}
            </span>
            <span className="text-muted text-xs">ID + QR minted on issue</span>
          </div>

          <button
            type="button"
            onClick={handleIssue}
            disabled={!canIssue}
            className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
          >
            {issuing ? (
              <><Loader2 size={18} className="animate-spin" /> Issuing Certificates…</>
            ) : (
              <><Send size={18} /> Issue {validRecipients.length || ''} Certificate{validRecipients.length === 1 ? '' : 's'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
