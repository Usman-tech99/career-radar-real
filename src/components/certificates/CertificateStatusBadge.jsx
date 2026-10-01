import { CheckCircle2, Ban, Layers, Clock } from 'lucide-react'

const CONFIG = {
  valid: { label: 'Valid', className: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30', Icon: CheckCircle2 },
  revoked: { label: 'Revoked', className: 'text-red-500 bg-red-500/10 border-red-500/30', Icon: Ban },
  superseded: { label: 'Replaced', className: 'text-amber-600 bg-amber-500/10 border-amber-500/30', Icon: Layers },
  expired: { label: 'Expired', className: 'text-slate-500 bg-slate-500/10 border-slate-500/30', Icon: Clock },
}

export default function CertificateStatusBadge({ status, size = 'md', className = '' }) {
  const config = CONFIG[status] || CONFIG.expired
  const { Icon } = config
  const compact = size === 'sm'

  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-full font-semibold whitespace-nowrap ${
        compact ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1'
      } ${config.className} ${className}`}
    >
      <Icon size={compact ? 12 : 14} className="shrink-0" />
      {config.label}
    </span>
  )
}

export { CONFIG as STATUS_CONFIG }