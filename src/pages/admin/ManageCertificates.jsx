import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Award, ShieldCheck, Ban, Eye, Download, Search, Filter, X, ChevronLeft, ChevronRight,
  Link2, RefreshCw, History, Loader2, AlertTriangle, FileText, Copy, CheckCircle2,
} from 'lucide-react'
import CertificateStatusBadge from '../../components/certificates/CertificateStatusBadge'
import {
  listCertificates, listTemplates, fetchCertificateStats, revokeCertificate, reissueCertificate,
  certificateVerifyUrl, certificatesToCsv, downloadCsv, openCertificatePdf, downloadCertificatePdf,
  fetchVerificationEvents, fetchAuditLogs, getCertificate,
} from '../../lib/certificates'
import { formatDate } from '../../lib/helpers'

const PAGE_SIZE = 25

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'valid', label: 'Valid' },
  { value: 'revoked', label: 'Revoked' },
  { value: 'superseded', label: 'Replaced' },
]

function StatCard({ label, value, icon: Icon, tone = 'text-gold', hint }) {
  return (
    <div className="glass-card">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full bg-white/[0.05] ${tone} shrink-0`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-muted text-xs font-medium">{label}</p>
          <p className="text-xl font-bold font-mono mt-0.5">{value ?? 0}</p>
          {hint && <p className="text-[11px] text-muted mt-0.5">{hint}</p>}
        </div>
      </div>
    </div>
  )
}

function Modal({ open, onClose, title, children, footer, wide }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`glass-card w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} my-8`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold">{title}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.04]">
            <X size={20} className="text-muted" />
          </button>
        </div>
        {children}
        {footer && <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border">{footer}</div>}
      </div>
    </div>
  )
}

function RevokeModal({ certificate, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const PRESETS = [
    'Issued in error',
    'Award criteria not met',
    'Recipient name is incorrect',
    'Replaced by a corrected certificate',
    'Withdrawn by the recipient',
  ]

  async function submit() {
    if (reason.trim().length < 4) {
      setError('Please give a clear reason (at least 4 characters)')
      return
    }
    setBusy(true)
    try {
      await revokeCertificate(certificate.id, reason.trim())
      toast.success(`${certificate.certificate_id} revoked`)
      onDone()
      onClose()
    } catch (err) {
      setError(err.message || 'Could not revoke this certificate')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={!!certificate}
      onClose={onClose}
      title="Revoke certificate"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost text-sm px-4 py-2">Cancel</button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="btn-danger text-sm px-4 py-2 inline-flex items-center gap-2"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Ban size={15} />}
            Revoke certificate
          </button>
        </>
      }
    >
      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
        <p className="text-sm">
          Revoking <strong className="font-mono">{certificate?.certificate_id}</strong> immediately changes its
          public verification result to <strong>Revoked</strong>. This cannot be undone.
        </p>
      </div>

      <label className="label">Reason (required, shown publicly)</label>
      <textarea
        value={reason}
        onChange={(e) => { setReason(e.target.value); setError('') }}
        className={`input-field h-24 ${error ? 'border-red-400' : ''}`}
        placeholder="Explain why this certificate is being revoked"
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}

      <div className="flex flex-wrap gap-2 mt-3">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => { setReason(preset); setError('') }}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-black/5 transition-colors text-muted"
          >
            {preset}
          </button>
        ))}
      </div>
    </Modal>
  )
}

function ReissueModal({ certificate, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (reason.trim().length < 4) {
      setError('Please give a reason for the reissue')
      return
    }
    setBusy(true)
    try {
      const created = await reissueCertificate(certificate.id, reason.trim(), {
        certificate_title: title.trim() || certificate.certificate_title,
      })
      toast.success(`New certificate ${created.certificate_id} issued`)
      onDone()
      onClose()
    } catch (err) {
      setError(err.message || 'Could not reissue')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={!!certificate}
      onClose={onClose}
      title="Reissue certificate"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost text-sm px-4 py-2">Cancel</button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="btn-primary text-sm px-4 py-2 inline-flex items-center gap-2"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Reissue
          </button>
        </>
      }
    >
      <p className="text-sm text-muted mb-4">
        A new certificate is created with a fresh ID and verification link. The original is marked
        as replaced and stays verifiable as historical record.
      </p>

      <label className="label">New title (optional)</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input-field mb-4"
        placeholder={certificate?.certificate_title}
      />

      <label className="label">Reason (required)</label>
      <textarea
        value={reason}
        onChange={(e) => { setReason(e.target.value); setError('') }}
        className={`input-field h-20 ${error ? 'border-red-400' : ''}`}
        placeholder="e.g. Corrected recipient name"
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </Modal>
  )
}

function DetailDrawer({ certificateId, revision = 0, onClose, onRevoke, onReissue }) {
  const [record, setRecord] = useState(null)
  const [events, setEvents] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [openingPdf, setOpeningPdf] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [row, verificationEvents, auditLogs] = await Promise.all([
        getCertificate(certificateId),
        fetchVerificationEvents({ certificateId, limit: 25 }),
        fetchAuditLogs({ certificateId, limit: 25 }),
      ])
      setRecord(row)
      setEvents(verificationEvents)
      setLogs(auditLogs)
    } catch (error) {
      toast.error(error.message || 'Could not load certificate details')
    } finally {
      setLoading(false)
    }
  }, [certificateId])

  useEffect(() => {
    load()
  }, [load])

  // The revoke and reissue dialogs change the row behind this drawer. The parent
  // bumps `revision` when they finish, so the drawer refetches instead of
  // continuing to show the pre-change status.
  useEffect(() => {
    if (revision > 0) load()
  }, [revision, load])

  async function handlePdf() {
    setOpeningPdf(true)
    try {
      await openCertificatePdf(record || certificateId)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setOpeningPdf(false)
    }
  }

  async function handleDownload() {
    setOpeningPdf(true)
    try {
      await downloadCertificatePdf(record || certificateId, record?.certificate_id)
      toast.success('Certificate ready')
      load()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setOpeningPdf(false)
    }
  }

  function copyLink() {
    navigator.clipboard?.writeText(certificateVerifyUrl(record.verification_token))
    toast.success('Verification link copied')
  }

  const Row = ({ label, value }) => (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted shrink-0">{label}</span>
      <span className="text-xs font-medium text-right break-words">{value ?? '—'}</span>
    </div>
  )

  return (
    <Modal open={!!certificateId} onClose={onClose} title="Certificate details" wide>
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-gold" />
        </div>
      ) : !record ? (
        <p className="text-muted text-center py-12">Certificate not found.</p>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <CertificateStatusBadge status={record.status} />
            {record.template_version > 1 && (
              <span
                className="text-xs text-muted"
                title="Design revision this certificate was issued under. Later edits to the template do not affect it."
              >
                Template v{record.template_version}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handlePdf} disabled={openingPdf} className="btn-ghost text-xs px-3 py-2 inline-flex items-center gap-1.5">
              {openingPdf ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />} View PDF
            </button>
            <button type="button" onClick={handleDownload} disabled={openingPdf} className="btn-ghost text-xs px-3 py-2 inline-flex items-center gap-1.5">
              <Download size={13} /> Download
            </button>
            <button type="button" onClick={copyLink} className="btn-ghost text-xs px-3 py-2 inline-flex items-center gap-1.5">
              <Copy size={13} /> Copy link
            </button>
            {/* Reissuing is only meaningful while a certificate is still the
                current one; revoking is offered on valid and superseded records
                alike, but never twice on an already-revoked certificate. */}
            {record.status !== 'revoked' && (
              <button type="button" onClick={() => onReissue(record)} className="btn-ghost text-xs px-3 py-2 inline-flex items-center gap-1.5">
                <RefreshCw size={13} /> Reissue
              </button>
            )}
            {record.status !== 'revoked' && (
              <button type="button" onClick={() => onRevoke(record)} className="text-xs px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-semibold inline-flex items-center gap-1.5">
                <Ban size={13} /> Revoke
              </button>
            )}
          </div>

          {record.status === 'revoked' && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-sm font-semibold text-red-500 mb-1">
                Revoked on {formatDate(record.revoked_at)}
              </p>
              <p className="text-xs text-red-400/90">{record.revocation_reason}</p>
            </div>
          )}

          {/* Record */}
          <div>
            <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
              <FileText size={14} className="text-gold" /> Record
            </h4>
            <Row label="Certificate ID" value={<span className="font-mono">{record.certificate_id}</span>} />
            <Row label="Recipient" value={record.recipient_name} />
            <Row label="Email" value={record.recipient_email} />
            <Row label="Title" value={record.certificate_title} />
            <Row label="Organisation" value={record.organization_name} />
            <Row label="Issue date" value={formatDate(record.issue_date)} />
            <Row label="Template" value={record.template_snapshot?.template_name} />
            <Row label="Design version" value={`v${record.template_version}`} />
            <Row
              label="Verification link"
              value={
                <a
                  href={`/verify/${record.verification_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-accent hover:underline inline-flex items-center gap-1"
                >
                  <Link2 size={11} /> Open
                </a>
              }
            />
          </div>

          {/* Engagement counters — issued vs downloaded vs verified */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.04] border border-border text-center">
              <p className="text-lg font-bold font-mono">{record.verification_count}</p>
              <p className="text-[11px] text-muted">Verified</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.04] border border-border text-center">
              <p className="text-lg font-bold font-mono">{record.download_count}</p>
              <p className="text-[11px] text-muted">Downloaded</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.04] border border-border text-center">
              <p className="text-xs font-mono">
                {record.last_verified_at ? formatDate(record.last_verified_at) : '—'}
              </p>
              <p className="text-[11px] text-muted">Last verified</p>
            </div>
          </div>

          {/* Verification activity */}
          <div>
            <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
              <ShieldCheck size={14} className="text-gold" /> Verification activity
            </h4>
            {events.length === 0 ? (
              <p className="text-xs text-muted py-3">Not verified by anyone yet.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between gap-3 text-xs py-1.5 px-2 rounded-lg bg-white/[0.03]">
                    <span className="flex items-center gap-2">
                      {event.outcome === 'found' ? (
                        <CheckCircle2 size={12} className="text-emerald-500" />
                      ) : (
                        <AlertTriangle size={12} className="text-amber-500" />
                      )}
                      <span className="text-muted">
                        {event.method.replace(/_/g, ' ')} · {event.outcome.replace(/_/g, ' ')}
                      </span>
                    </span>
                    <span className="text-muted shrink-0">{formatDate(event.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit trail */}
          <div>
            <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
              <History size={14} className="text-gold" /> Audit trail
            </h4>
            {logs.length === 0 ? (
              <p className="text-xs text-muted py-3">No audit entries.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between gap-3 text-xs py-1.5 px-2 rounded-lg bg-white/[0.03]">
                    <span className="font-medium">
                      {log.action.replace(/_/g, ' ')}
                      {log.action === 'certificate_downloaded' && log.detail?.channel && (
                        <span className="text-muted font-normal"> · {log.detail.channel}</span>
                      )}
                    </span>
                    <span className="text-muted shrink-0">
                      {log.performed_by_email || (log.action === 'certificate_downloaded' ? 'Public' : '—')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

export default function ManageCertificates() {
  const [data, setData] = useState({ rows: [], total: 0 })
  const [stats, setStats] = useState(null)
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [templateId, setTemplateId] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [detailId, setDetailId] = useState(null)
  const [detailRevision, setDetailRevision] = useState(0)
  const [revokeTarget, setRevokeTarget] = useState(null)
  const [reissueTarget, setReissueTarget] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(0)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => { setPage(0) }, [status, templateId, dateFrom, dateTo])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [list, statsRows, templateRows] = await Promise.all([
        listCertificates({
          search: debouncedSearch,
          status,
          templateId,
          dateFrom,
          dateTo,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        }),
        fetchCertificateStats(),
        listTemplates(),
      ])
      setData(list)
      setStats(statsRows)
      setTemplates(templateRows)
    } catch (error) {
      toast.error(error.message || 'Could not load certificates')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, status, templateId, dateFrom, dateTo, page])

  useEffect(() => {
    load()
  }, [load])

  /**
   * Called when the revoke or reissue dialog finishes. Bumping the revision makes
   * an open detail drawer refetch, which is what keeps its status badge honest.
   */
  const handleRecordChanged = useCallback(async () => {
    setDetailRevision((n) => n + 1)
    await load()
  }, [load])

  const activeFilters =
    (status !== 'all' ? 1 : 0) +
    (templateId !== 'all' ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0)

  async function handleExport() {
    try {
      // Export honours the current filters rather than dumping the whole table.
      const all = await listCertificates({
        search: debouncedSearch,
        status,
        templateId,
        dateFrom,
        dateTo,
        limit: 10000,
      })
      if (!all.rows.length) {
        toast.error('Nothing to export with the current filters')
        return
      }
      downloadCsv(
        `certificates-${new Date().toISOString().slice(0, 10)}.csv`,
        certificatesToCsv(all.rows)
      )
      toast.success(`Exported ${all.rows.length} certificate${all.rows.length === 1 ? '' : 's'}`)
    } catch (error) {
      toast.error(error.message)
    }
  }

  function clearFilters() {
    setStatus('all')
    setTemplateId('all')
    setDateFrom('')
    setDateTo('')
    setSearch('')
  }

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Certificates</h1>
          <p className="text-sm text-muted mt-1">
            Track every issued certificate, its verification activity and its history.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleExport} className="btn-ghost text-sm px-4 py-2.5 inline-flex items-center gap-2">
            <Download size={16} /> Export CSV
          </button>
          <a href="/admin/certificates/issue" className="btn-primary text-sm px-4 py-2.5 inline-flex items-center gap-2">
            <Award size={16} /> Issue certificate
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total issued" value={stats?.total_issued} icon={Award} />
        <StatCard label="Currently valid" value={stats?.currently_valid} icon={ShieldCheck} tone="text-emerald-500" />
        <StatCard label="Revoked" value={stats?.revoked} icon={Ban} tone="text-red-500" />
        <StatCard
          label="Public verifications"
          value={stats?.total_verifications ?? 0}
          icon={Eye}
          tone="text-blue-accent"
          hint={`${stats?.total_downloads ?? 0} PDF downloads recorded`}
        />
      </div>

      <div className="glass-card mb-6">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by recipient, certificate ID or email…"
              className="input-field pl-10 py-2.5"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`btn-ghost text-sm px-4 py-2.5 inline-flex items-center gap-2 shrink-0 ${
                activeFilters ? 'border-gold text-gold' : ''
              }`}
            >
              <Filter size={15} /> Filters
              {activeFilters > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-gold text-[10px] font-bold text-navy-dark">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Template</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="input-field py-2.5"
              >
                <option value="all">All templates</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Issued from</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field py-2.5" />
            </div>
            <div>
              <label className="label">Issued to</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field py-2.5" />
            </div>
            {activeFilters > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="sm:col-span-3 text-xs text-muted hover:text-navy transition-colors text-left"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        <div className="flex gap-1.5 mt-4 pt-4 border-t border-border overflow-x-auto hide-scrollbar">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatus(tab.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                status === tab.value ? 'bg-gold text-navy-dark' : 'text-muted hover:bg-black/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="glass-card"><div className="skeleton w-full h-64 rounded-2xl" /></div>
      ) : data.rows.length === 0 ? (
        <div className="glass-card text-center py-16">
          <Award size={44} className="mx-auto text-muted opacity-40 mb-4" />
          <h3 className="font-bold text-lg mb-1">No certificates found</h3>
          <p className="text-sm text-muted mb-6">
            {data.total === 0 && !debouncedSearch && activeFilters === 0
              ? 'You have not issued any certificates yet.'
              : 'Try adjusting your search or filters.'}
          </p>
          <a href="/admin/certificates/issue" className="btn-primary inline-flex items-center gap-2">
            <Award size={16} /> Issue your first certificate
          </a>
        </div>
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="p-3 text-xs font-medium text-muted">Recipient</th>
                <th className="p-3 text-xs font-medium text-muted">Certificate ID</th>
                <th className="p-3 text-xs font-medium text-muted hidden md:table-cell">Title</th>
                <th className="p-3 text-xs font-medium text-muted">Issued</th>
                <th className="p-3 text-xs font-medium text-muted text-center">Activity</th>
                <th className="p-3 text-xs font-medium text-muted">Status</th>
                <th className="p-3 text-right text-xs font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((certificate) => (
                <tr
                  key={certificate.id}
                  className="border-b border-border/50 hover:bg-white/[0.02] cursor-pointer"
                  onClick={() => setDetailId(certificate.id)}
                >
                  <td className="p-3">
                    <p className="font-medium text-sm">{certificate.recipient_name}</p>
                    {certificate.recipient_email && (
                      <p className="text-xs text-muted truncate max-w-[180px]">{certificate.recipient_email}</p>
                    )}
                  </td>
                  <td className="p-3 font-mono text-xs whitespace-nowrap">{certificate.certificate_id}</td>
                  <td className="p-3 text-sm hidden md:table-cell max-w-[220px] truncate">
                    {certificate.certificate_title}
                  </td>
                  <td className="p-3 text-xs text-muted whitespace-nowrap">{formatDate(certificate.issue_date)}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2.5 text-xs text-muted">
                      <span title="Times verified" className="inline-flex items-center gap-1">
                        <Eye size={12} /> {certificate.verification_count}
                      </span>
                      <span title="Times downloaded" className="inline-flex items-center gap-1">
                        <Download size={12} /> {certificate.download_count}
                      </span>
                    </div>
                  </td>
                  <td className="p-3"><CertificateStatusBadge status={certificate.status} size="sm" /></td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDetailId(certificate.id) }}
                      className="text-xs px-2.5 py-1.5 rounded-lg hover:bg-black/5 transition-colors font-semibold"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data.total)} of {data.total}
              </p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 rounded-lg border border-border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5 transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="px-3 py-2 text-xs text-muted self-center">
                  {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 rounded-lg border border-border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5 transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {detailId && (
        <DetailDrawer
          certificateId={detailId}
          revision={detailRevision}
          onClose={() => setDetailId(null)}
          onRevoke={setRevokeTarget}
          onReissue={setReissueTarget}
        />
      )}

      {revokeTarget && (
        <RevokeModal
          certificate={revokeTarget}
          onClose={() => setRevokeTarget(null)}
          onDone={handleRecordChanged}
        />
      )}

      {reissueTarget && (
        <ReissueModal
          certificate={reissueTarget}
          onClose={() => setReissueTarget(null)}
          onDone={handleRecordChanged}
        />
      )}
    </div>
  )
}
