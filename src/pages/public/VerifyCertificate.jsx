import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ShieldCheck, ShieldAlert, ShieldX, Search, Loader2, Award, Calendar, User, Building2,
  QrCode, Download, RotateCcw, Fingerprint,
} from 'lucide-react'
import {
  parseCertificateReference,
  requestPublicCertificatePdf,
  verifyCertificate,
} from '../../lib/certificates'
import { formatDate } from '../../lib/helpers'

const STATUS_PRESENTATION = {
  valid: {
    ring: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    Icon: ShieldCheck,
    heading: 'Valid certificate',
    blurb: 'This certificate is authentic and currently valid.',
  },
  revoked: {
    ring: 'border-red-500/40',
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    Icon: ShieldX,
    heading: 'Revoked certificate',
    blurb: 'This certificate is no longer valid.',
  },
  superseded: {
    ring: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    Icon: ShieldAlert,
    heading: 'Replaced certificate',
    blurb: 'This certificate was replaced by a newer version.',
  },
}

function VerdictBanner({ status, certificate }) {
  const tone = STATUS_PRESENTATION[status]
  if (!tone) return null
  const { Icon } = tone

  return (
    <div className={`rounded-2xl border ${tone.ring} ${tone.bg} p-6 sm:p-8 text-center mb-6`}>
      <div className={`inline-flex p-4 rounded-full bg-white/[0.06] ${tone.text} mb-4`}>
        <Icon size={36} />
      </div>
      <h2 className={`text-2xl font-bold ${tone.text} mb-1`}>{tone.heading}</h2>
      <p className="text-sm text-muted">{tone.blurb}</p>

      <p className="font-mono text-sm mt-5 inline-block px-3 py-1.5 rounded-lg bg-black/25">
        {certificate.certificate_id}
      </p>

      {status === 'revoked' && certificate.revocation_reason && (
        <div className="mt-5 text-left max-w-lg mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">Revocation reason</p>
          <p className="text-sm text-red-400/90">{certificate.revocation_reason}</p>
          {certificate.revoked_at && (
            <p className="text-xs text-muted mt-1">Revoked on {formatDate(certificate.revoked_at)}</p>
          )}
        </div>
      )}

      {status === 'superseded' && certificate.superseded_by_id && (
        <div className="mt-5 text-left max-w-lg mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">Replaced by</p>
          <p className="font-mono text-sm text-amber-400">{certificate.superseded_by_id}</p>
        </div>
      )}
    </div>
  )
}

function Signatory({ name, title, imageUrl }) {
  if (!name) return null
  return (
    <div className="text-center">
      <div className="h-12 flex items-end justify-center mb-1">
        {imageUrl && (
          <img src={imageUrl} alt={`Signature of ${name}`} className="max-h-12 object-contain" />
        )}
      </div>
      <div className="w-28 mx-auto border-t border-navy/20 pt-1.5">
        <p className="text-xs font-semibold">{name}</p>
        {title && <p className="text-[10px] text-muted">{title}</p>}
      </div>
    </div>
  )
}

function CertificateDetails({ certificate }) {
  const signatories = [
    { name: certificate.signatory_1_name, title: certificate.signatory_1_title, imageUrl: certificate.signatory_1_image_url },
    { name: certificate.signatory_2_name, title: certificate.signatory_2_title, imageUrl: certificate.signatory_2_image_url },
  ].filter((s) => s.name)

  // The PDF link is minted on click rather than during verification, so the
  // download counter records downloads rather than verification traffic.
  const [pdfState, setPdfState] = useState({ status: 'idle' })

  async function handleDownload() {
    setPdfState({ status: 'loading' })
    try {
      const url = await requestPublicCertificatePdf(certificate.certificate_id, 'certificate_id')
      window.open(url, '_blank', 'noopener')
      setPdfState({ status: 'done' })
    } catch (error) {
      setPdfState({ status: 'error', message: error.message })
    }
  }

  return (
    <div className="glass-card p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-gold font-bold mb-1">Certificate of</p>
          <h2 className="text-2xl font-bold">{certificate.certificate_title}</h2>
          <p className="text-muted text-sm mt-1">
            awarded to <strong className="text-navy">{certificate.recipient_name}</strong>
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-sm font-bold">{certificate.certificate_id}</p>
          <p className="text-xs text-muted mt-0.5">Issued {formatDate(certificate.issue_date)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-5 border-y border-border mb-6">
        <div className="flex items-start gap-3">
          <User size={16} className="text-gold mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted">Recipient</p>
            <p className="text-sm font-semibold">{certificate.recipient_name}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Building2 size={16} className="text-gold mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted">Issued by</p>
            <p className="text-sm font-semibold">{certificate.organization_name}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Calendar size={16} className="text-gold mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted">Issue date</p>
            <p className="text-sm font-semibold">{formatDate(certificate.issue_date)}</p>
          </div>
        </div>
      </div>

      {certificate.achievement && (
        <p className="text-sm font-medium mb-3">{certificate.achievement}</p>
      )}
      {certificate.description && (
        <p className="text-sm text-muted leading-relaxed mb-6">{certificate.description}</p>
      )}

      {signatories.length > 0 && (
        <div className="grid grid-cols-2 gap-6 mb-6 pt-4 border-t border-border">
          {signatories.map((s) => (
            <Signatory key={s.name} {...s} />
          ))}
        </div>
      )}

      {certificate.status === 'valid' && (
        <div className="pt-5 border-t border-border">
          <button
            type="button"
            onClick={handleDownload}
            disabled={pdfState.status === 'loading'}
            className="btn-primary text-sm px-5 py-2.5 inline-flex items-center gap-2 disabled:opacity-60"
          >
            {pdfState.status === 'loading'
              ? <Loader2 size={15} className="animate-spin" />
              : <Download size={15} />}
            {pdfState.status === 'done' ? 'Open PDF certificate again' : 'Open PDF certificate'}
          </button>
          <p className="text-[11px] text-muted mt-2">
            This secure link expires shortly and each download is recorded.
          </p>
          {pdfState.status === 'error' && (
            <p className="text-[11px] text-red-400 mt-1">{pdfState.message}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function VerifyCertificate() {
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [reference, setReference] = useState('')
  const [state, setState] = useState('idle')
  const [certificate, setCertificate] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const lookup = useCallback(async (value, method) => {
    const trimmed = String(value || '').trim()
    if (!trimmed) return
    setLoading(true)
    setState('loading')
    try {
      const result = await verifyCertificate(trimmed, method)
      setCertificate(result)
      setErrorMessage('')
      setState(STATUS_PRESENTATION[result.status] ? result.status : 'error')
    } catch (error) {
      setCertificate(null)
      if (error.code === 'not_found') {
        setState('not_found')
        setErrorMessage('')
      } else {
        setState('error')
        setErrorMessage(error.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // A token in the path means the visitor scanned the QR code or opened a
  // shared link, so verify straight away.
  useEffect(() => {
    if (!token) return
    const parsed = parseCertificateReference(token) || { reference: token, method: 'verification_url' }
    setReference(parsed.reference)
    lookup(parsed.reference, 'verification_url')
  }, [token, lookup])

  // The form redirects to /verify?ref=… so a checked result stays shareable.
  // A pasted link may land on /verify?ref=<full URL>, so parse before looking up.
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (!ref) return
    const parsed = parseCertificateReference(ref)
    if (!parsed) return
    setReference(parsed.reference)
    lookup(parsed.reference, parsed.method)
  }, [searchParams, lookup])

  function handleSubmit(event) {
    event.preventDefault()
    if (loading) return
    // Accept a bare ID, a token, or a whole pasted verification link.
    const parsed = parseCertificateReference(reference)
    if (!parsed) return

    setReference(parsed.reference)
    if (parsed.method === 'verification_url') {
      // Tokens get a canonical /verify/<token> URL so the result is shareable
      // and the same as the QR code destination.
      navigate(`/verify/${encodeURIComponent(parsed.reference)}`, { replace: true })
      return
    }
    if (token) {
      lookup(parsed.reference, parsed.method)
    } else {
      navigate(`/verify?ref=${encodeURIComponent(parsed.reference)}`)
    }
  }

  function reset() {
    setState('idle')
    setCertificate(null)
    setErrorMessage('')
    setReference('')
    navigate('/verify', { replace: true })
  }

  const found = state !== 'idle' && state !== 'loading' && state !== 'not_found' && state !== 'error' && !!certificate

  return (
    <div className="min-h-screen bg-ink-darker">
      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 rounded-2xl bg-gold/10 text-gold mb-5">
            <ShieldCheck size={36} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">Verify a Certificate</h1>
          <p className="text-muted text-lg max-w-xl mx-auto">
            Check the authenticity of any Career Radar certificate using its ID or by scanning its QR code.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 mb-8">
          <label className="label" htmlFor="cert-reference">
            Certificate ID or verification link
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <QrCode size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="cert-reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. CR-2026-000001"
                className="input-field pl-10"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !reference.trim()}
              className="btn-primary px-6 py-3 inline-flex items-center justify-center gap-2 shrink-0"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Verify
            </button>
          </div>
        </form>

        {state === 'idle' && (
          <div className="text-center text-muted py-8">
            <div className="inline-flex p-4 rounded-2xl bg-white/[0.03] border border-border mb-4">
              <Award size={32} />
            </div>
            <p className="text-sm">
              Scan the QR code on a certificate, or enter the certificate ID above to verify it.
            </p>
          </div>
        )}

        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 size={32} className="animate-spin text-gold" />
            <p className="text-muted text-sm">Verifying certificate…</p>
          </div>
        )}

        {state === 'not_found' && (
          <div className="rounded-2xl border border-border bg-white/[0.03] p-6 sm:p-8 text-center">
            <div className="inline-flex p-4 rounded-full bg-white/[0.06] text-muted mb-4">
              <Search size={32} />
            </div>
            <h2 className="text-xl font-bold mb-1">No certificate found</h2>
            <p className="text-sm text-muted mb-5">
              We could not find a certificate matching that reference. Please check the ID and try again.
            </p>
            <button type="button" onClick={reset} className="btn-ghost text-sm px-4 py-2 inline-flex items-center gap-2">
              <RotateCcw size={14} /> Try again
            </button>
          </div>
        )}

        {state === 'error' && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6 sm:p-8 text-center">
            <div className="inline-flex p-4 rounded-full bg-white/[0.06] text-red-500 mb-4">
              <ShieldX size={32} />
            </div>
            <h2 className="text-xl font-bold text-red-500 mb-1">Verification failed</h2>
            <p className="text-sm text-muted mb-5">{errorMessage}</p>
            <button type="button" onClick={reset} className="btn-ghost text-sm px-4 py-2 inline-flex items-center gap-2">
              <RotateCcw size={14} /> Try again
            </button>
          </div>
        )}

        {found && (
          <>
            <VerdictBanner status={state} certificate={certificate} />
            <CertificateDetails certificate={certificate} />

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={reset}
                className="btn-ghost text-sm px-5 py-2.5 inline-flex items-center gap-2"
              >
                <RotateCcw size={14} /> Verify another certificate
              </button>
              <p className="text-xs text-muted inline-flex items-center gap-1.5">
                <Fingerprint size={13} />
                {certificate.certificate_id} · {certificate.organization_name}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
