import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Award, ShieldCheck, Download, ExternalLink, Copy, Check, Search,
  Calendar, Building2, User, Share2, Loader2, Sparkles, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import {
  listMyCertificates,
  certificateVerifyUrl,
  openCertificatePrintView,
} from '../../lib/certificates'
import { formatDate } from '../../lib/helpers'
import CertificateStatusBadge from '../../components/certificates/CertificateStatusBadge'

export default function MyCertificates() {
  const { user } = useAuth()
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [generatingId, setGeneratingId] = useState(null)

  useEffect(() => {
    loadCertificates()
  }, [])

  async function loadCertificates() {
    setLoading(true)
    try {
      const rows = await listMyCertificates()
      setCertificates(rows)
    } catch (err) {
      console.error('Failed to load certificates:', err)
      toast.error(err.message || 'Could not load your certificates')
    } finally {
      setLoading(false)
    }
  }

  const filtered = certificates.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.certificate_title?.toLowerCase().includes(q) ||
      c.certificate_id?.toLowerCase().includes(q) ||
      c.organization_name?.toLowerCase().includes(q) ||
      c.achievement?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    )
  })

  async function handleView(cert) {
    setGeneratingId(cert.id)
    let targetWin = null
    try {
      targetWin = window.open('about:blank', '_blank')
      if (targetWin) {
        targetWin.document.write(
          '<!DOCTYPE html><html><head><title>Career Radar Certificate</title></head><body style="margin:0;background:#07122A;display:flex;align-items:center;justify-content:center;height:100vh;color:#C9993C;font-family:Inter,sans-serif;"><h3>Preparing official certificate...</h3></body></html>'
        )
      }
      await openCertificatePrintView(cert, false, targetWin)
    } catch (error) {
      if (targetWin && !targetWin.closed) targetWin.close()
      toast.error(error.message || 'Could not render certificate view')
    } finally {
      setGeneratingId(null)
    }
  }

  async function handleDownload(cert) {
    setGeneratingId(cert.id)
    let targetWin = null
    try {
      targetWin = window.open('about:blank', '_blank')
      if (targetWin) {
        targetWin.document.write(
          '<!DOCTYPE html><html><head><title>Career Radar Certificate</title></head><body style="margin:0;background:#07122A;display:flex;align-items:center;justify-content:center;height:100vh;color:#C9993C;font-family:Inter,sans-serif;"><h3>Preparing official print / PDF...</h3></body></html>'
        )
      }
      await openCertificatePrintView(cert, true, targetWin)
    } catch (error) {
      if (targetWin && !targetWin.closed) targetWin.close()
      toast.error(error.message || 'Could not trigger PDF download')
    } finally {
      setGeneratingId(null)
    }
  }

  function handleCopyLink(cert) {
    const url = certificateVerifyUrl(cert.verification_token) || `${window.location.origin}/verify?ref=${cert.certificate_id}`
    navigator.clipboard.writeText(url)
    setCopiedId(cert.id)
    toast.success('Verification link copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2500)
  }

  function handleShareLinkedIn(cert) {
    const certUrl = certificateVerifyUrl(cert.verification_token) || `${window.location.origin}/verify?ref=${cert.certificate_id}`
    const title = encodeURIComponent(cert.certificate_title || 'Certificate of Appreciation')
    const org = encodeURIComponent(cert.organization_name || 'Career Radar')
    const certNum = encodeURIComponent(cert.certificate_id || '')
    const url = encodeURIComponent(certUrl)

    // Formatted LinkedIn Add to Profile URL
    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${title}&organizationName=${org}&certUrl=${url}&certId=${certNum}`
    window.open(linkedInUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-surface px-4 py-8 sm:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-semibold uppercase tracking-wider mb-2">
            <Award size={14} /> Official Credentials
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy">My Certificates</h1>
          <p className="text-muted text-sm mt-1">
            Access, view, download, and share authentic credentials issued to{' '}
            <span className="font-medium text-navy">{user?.email}</span>.
          </p>
        </div>

        {/* Quick Search */}
        {certificates.length > 0 && (
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search certificates…"
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-white border border-border focus:outline-none focus:border-gold transition-colors"
            />
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={36} className="animate-spin text-gold" />
          <p className="text-sm text-muted">Retrieving your certificates…</p>
        </div>
      ) : certificates.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-border bg-white p-8 sm:p-12 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 text-gold mx-auto flex items-center justify-center mb-4">
            <Award size={32} />
          </div>
          <h3 className="text-xl font-bold text-navy mb-2">No certificates found</h3>
          <p className="text-sm text-muted leading-relaxed mb-6">
            We couldn't find any certificates linked to <strong className="text-navy">{user?.email}</strong> yet.
            Certificates are automatically connected to your account whenever an administrator issues one to your registered email address.
          </p>

          <div className="rounded-xl bg-slate-50 border border-border/80 p-4 text-left text-xs text-muted space-y-2 mb-6">
            <div className="flex items-start gap-2">
              <Sparkles size={15} className="text-gold shrink-0 mt-0.5" />
              <span>
                If you were awarded a certificate under a different email address, let the organizer or Career Radar team know to update the recipient email on your record.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle size={15} className="text-slate-400 shrink-0 mt-0.5" />
              <span>
                Have a Certificate ID or link already? You can verify and access it publicly anytime on the{' '}
                <Link to="/verify" className="text-gold font-medium hover:underline">
                  Public Verification Portal
                </Link>.
              </span>
            </div>
          </div>

          <Link to="/verify" className="btn-ghost inline-flex items-center gap-2 text-sm px-5 py-2.5">
            <ShieldCheck size={16} /> Check Public Verification
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        /* Filter Empty */
        <div className="text-center py-16 text-muted">
          <p className="text-base font-medium mb-1">No certificates match your search.</p>
          <button
            onClick={() => setSearch('')}
            className="text-xs text-gold font-semibold hover:underline mt-1"
          >
            Clear search filter
          </button>
        </div>
      ) : (
        /* Certificates Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((cert) => {
            const isWorking = generatingId === cert.id
            const isCopied = copiedId === cert.id
            const verifyPath = cert.verification_token
              ? `/verify/${cert.verification_token}`
              : `/verify?ref=${cert.certificate_id}`

            return (
              <div
                key={cert.id}
                className="rounded-2xl border border-border bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Top line: Status + ID */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <CertificateStatusBadge status={cert.status} size="sm" />
                    <span className="font-mono text-xs text-muted bg-slate-100 px-2.5 py-1 rounded-md font-semibold">
                      {cert.certificate_id}
                    </span>
                  </div>

                  {/* Title & Organization */}
                  <h3 className="text-lg font-bold text-navy mb-1 leading-snug">
                    {cert.certificate_title || 'Certificate of Appreciation'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted mb-4">
                    <Building2 size={13} className="text-gold shrink-0" />
                    <span>{cert.organization_name || 'Career Radar'}</span>
                    <span>•</span>
                    <Calendar size={13} className="text-gold shrink-0" />
                    <span>Issued {formatDate(cert.issue_date)}</span>
                  </div>

                  {/* Description / Achievement */}
                  {cert.achievement && (
                    <div className="rounded-xl bg-gold/5 border border-gold/15 p-3 mb-4 text-xs">
                      <p className="font-semibold text-gold mb-0.5 uppercase tracking-wide text-[10px]">
                        Recognition / Achievement
                      </p>
                      <p className="text-navy/90 font-medium leading-relaxed">
                        {cert.achievement}
                      </p>
                    </div>
                  )}

                  {cert.description && (
                    <p className="text-xs text-muted line-clamp-2 mb-4 leading-relaxed">
                      {cert.description}
                    </p>
                  )}

                  {/* Signatories preview */}
                  {(cert.signatory_1_name || cert.signatory_2_name) && (
                    <div className="pt-3 border-t border-border/60 mb-5 flex flex-wrap items-center gap-4 text-xs text-muted">
                      {cert.signatory_1_name && (
                        <div>
                          <p className="font-semibold text-navy text-[11px]">{cert.signatory_1_name}</p>
                          <p className="text-[10px] text-muted">{cert.signatory_1_title || 'Signatory'}</p>
                        </div>
                      )}
                      {cert.signatory_2_name && (
                        <div>
                          <p className="font-semibold text-navy text-[11px]">{cert.signatory_2_name}</p>
                          <p className="text-[10px] text-muted">{cert.signatory_2_title || 'Signatory'}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleView(cert)}
                      disabled={isWorking}
                      className="btn-primary text-xs px-3.5 py-2 inline-flex items-center gap-1.5"
                    >
                      {isWorking ? <Loader2 size={13} className="animate-spin" /> : <Award size={13} />}
                      View Certificate
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(cert)}
                      disabled={isWorking}
                      className="btn-ghost text-xs px-3 py-2 inline-flex items-center gap-1.5"
                      title="Save high-resolution vector PDF / Print"
                    >
                      <Download size={13} />
                      Save PDF
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Copy Link */}
                    <button
                      type="button"
                      onClick={() => handleCopyLink(cert)}
                      className="p-2 rounded-lg text-muted hover:text-navy hover:bg-slate-100 transition-colors"
                      title="Copy Public Verification Link"
                    >
                      {isCopied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                    </button>

                    {/* Add to LinkedIn */}
                    <button
                      type="button"
                      onClick={() => handleShareLinkedIn(cert)}
                      className="p-2 rounded-lg text-muted hover:text-[#0A66C2] hover:bg-slate-100 transition-colors"
                      title="Add to LinkedIn Profile"
                    >
                      <Share2 size={15} />
                    </button>

                    {/* Open Public Verification Page */}
                    <Link
                      to={verifyPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-muted hover:text-navy hover:bg-slate-100 transition-colors"
                      title="Open Public Verification Page"
                    >
                      <ExternalLink size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
