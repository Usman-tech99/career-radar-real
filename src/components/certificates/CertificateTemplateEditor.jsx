import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Type, Palette, Frame as FrameIcon, LayoutGrid, Images, Save, X, Sparkles, Undo2,
} from 'lucide-react'
import CertificatePreview from '../../components/certificates/CertificatePreview'
import AssetUpload from '../../components/certificates/AssetUpload'
import { CERTIFICATE_TYPES } from '../../lib/certificates'
import { DEFAULT_DESIGN, normalizeDesign } from '../../../supabase/functions/generate-certificate-pdf/certificateHtml.js'

const TABS = [
  { id: 'content', label: 'Content', icon: Type },
  { id: 'typography', label: 'Typography', icon: Sparkles },
  { id: 'style', label: 'Colours & Frame', icon: Palette },
  { id: 'layout', label: 'Layout', icon: LayoutGrid },
  { id: 'media', label: 'Images', icon: Images },
]

const FONT_OPTIONS = [
  'Playfair Display', 'Cormorant Garamond', 'Inter', 'Poppins', 'Lato',
  'Georgia', 'Times New Roman', 'Arial', 'Great Vibes',
]

const FRAME_STYLES = [
  { value: 'double', label: 'Double' },
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'none', label: 'None' },
]

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 rounded-lg border border-border bg-white cursor-pointer p-1"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field py-2 text-sm font-mono"
          spellCheck={false}
        />
      </div>
    </div>
  )
}

function NumberField({ label, value, onChange, min = 0, max = 999, step = 1, suffix = '' }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="input-field py-2 text-sm"
        />
        {suffix && <span className="text-xs text-muted shrink-0">{suffix}</span>}
      </div>
    </div>
  )
}

/**
 * Full-screen certificate template editor.
 * Every change is applied to a local draft and reflected instantly in the live
 * preview, which renders the exact HTML the PDF generator uses.
 */
export default function CertificateTemplateEditor({ initialTemplate, onClose, onSave }) {
  const isEditing = !!initialTemplate?.id

  const [activeTab, setActiveTab] = useState('content')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const [template, setTemplate] = useState(() => ({
    name: initialTemplate?.name || '',
    description: initialTemplate?.description || '',
    certificate_type: initialTemplate?.certificate_type || 'achievement',
    orientation: initialTemplate?.orientation || 'landscape',
    page_size: initialTemplate?.page_size || 'A4',
    background_url: initialTemplate?.background_url || '',
    is_active: initialTemplate?.is_active ?? true,
  }))

  const [baseline, setBaseline] = useState(() => JSON.stringify(initialTemplate?.design || {}))
  const [design, setDesign] = useState(() => normalizeDesign(initialTemplate?.design || {}))

  const dirty = useMemo(
    () => JSON.stringify(design) !== JSON.stringify(normalizeDesign(initialTemplate?.design || {})),
    [design, initialTemplate]
  )

  const dirtyMeta = useMemo(
    () =>
      template.name !== (initialTemplate?.name || '') ||
      template.description !== (initialTemplate?.description || '') ||
      template.certificate_type !== (initialTemplate?.certificate_type || 'achievement') ||
      template.orientation !== (initialTemplate?.orientation || 'landscape') ||
      template.page_size !== (initialTemplate?.page_size || 'A4') ||
      template.background_url !== (initialTemplate?.background_url || ''),
    [template, initialTemplate]
  )

  const patchDesign = (section, key, value) =>
    setDesign((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }))

  const patchTemplate = (key, value) => setTemplate((prev) => ({ ...prev, [key]: value }))

  const resetDesign = () => {
    setDesign(normalizeDesign(initialTemplate?.design || {}))
    setBaseline(JSON.stringify(initialTemplate?.design || {}))
  }

  // Preview values come from the shared renderer so the placeholder data
  // exercises the exact same code path as a real certificate.
  const previewData = useMemo(
    () => ({
      certificateId: 'CR-2026-000123',
      verificationUrl:
        typeof window !== 'undefined'
          ? `${window.location.origin}/verify/v_preview000000000000000000000000000000000000000000`
          : 'https://www.career-radar.space/verify/v_preview',
      recipientName: 'Recipient Full Name',
      certificateTitle: template.name ? `${template.name} Award` : 'Certificate Title',
      certificateType: template.certificate_type,
      organizationName: 'Career Radar',
      organizationLogoUrl: '',
      issueDate: new Date().toISOString().slice(0, 10),
      signatory1Name: 'Authorised Signatory',
      signatory1Title: 'Director',
      signatory2Name: '',
      signatory2Title: '',
      backgroundUrl: template.background_url || '',
    }),
    [template.name, template.certificate_type, template.background_url]
  )

  function validate() {
    const next = {}
    if (!template.name.trim()) next.name = 'Give the template a name'
    else if (template.name.trim().length > 120) next.name = 'Keep the name under 120 characters'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSave() {
    if (!validate()) {
      toast.error('Please fix the highlighted fields')
      return
    }
    setSaving(true)
    try {
      await onSave({
        ...template,
        name: template.name.trim(),
        description: template.description?.trim() || null,
        design,
      })
      setBaseline(JSON.stringify(design))
    } catch (error) {
      toast.error(error.message || 'Could not save the template')
    } finally {
      setSaving(false)
    }
  }

  // Warn before losing unsaved design edits.
  useEffect(() => {
    function handler(event) {
      if (dirty || dirtyMeta) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty, dirtyMeta])

  const palette = design.palette
  const typo = design.typography

  return (
    <div className="fixed inset-0 z-[9999] bg-surface flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-6 h-16 border-b border-border shrink-0">
        <h2 className="text-lg font-bold truncate">
          {isEditing ? `Edit template — ${initialTemplate.name}` : 'New certificate template'}
        </h2>

        {(dirty || dirtyMeta) && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30 whitespace-nowrap">
            Unsaved changes
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={resetDesign}
            disabled={!dirty}
            className="btn-ghost text-sm px-3 py-2 inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Undo2 size={15} /> Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-black/5 transition-colors"
            aria-label="Close editor"
          >
            <X size={20} className="text-muted" />
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-sm px-4 py-2 inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            <Save size={15} />
            {saving ? 'Saving…' : 'Save template'}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] overflow-hidden">
        {/* Controls */}
        <div className="flex flex-col border-r border-border overflow-hidden min-h-0">
          <div className="flex border-b border-border overflow-x-auto hide-scrollbar shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-gold text-gold'
                    : 'border-transparent text-muted hover:text-navy'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {activeTab === 'content' && (
              <>
                <div>
                  <label className="label">Template name *</label>
                  <input
                    value={template.name}
                    onChange={(e) => {
                      patchTemplate('name', e.target.value)
                      if (errors.name) setErrors((p) => ({ ...p, name: null }))
                    }}
                    className={`input-field ${errors.name ? 'border-red-400' : ''}`}
                    placeholder="e.g. Course Completion Certificate"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="label">Internal description</label>
                  <textarea
                    value={template.description}
                    onChange={(e) => patchTemplate('description', e.target.value)}
                    className="input-field h-20"
                    placeholder="Shown to admins only — not printed on the certificate"
                  />
                </div>

                <div>
                  <label className="label">Certificate type</label>
                  <select
                    value={template.certificate_type}
                    onChange={(e) => patchTemplate('certificate_type', e.target.value)}
                    className="input-field"
                  >
                    {CERTIFICATE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted mt-1">
                    Sets the default heading, e.g. &ldquo;Certificate of Achievement&rdquo;.
                  </p>
                </div>

                <div className="pt-2 border-t border-border space-y-4">
                  <div>
                    <label className="label">Heading override</label>
                    <input
                      value={design.content.eyebrow}
                      onChange={(e) => patchDesign('content', 'eyebrow', e.target.value)}
                      className="input-field"
                      placeholder="Leave blank to use the certificate type"
                    />
                  </div>

                  <div>
                    <label className="label">Intro line</label>
                    <input
                      value={design.content.intro}
                      onChange={(e) => patchDesign('content', 'intro', e.target.value)}
                      className="input-field"
                      placeholder="This is to certify that"
                    />
                  </div>

                  <div>
                    <label className="label">Line above the award title</label>
                    <input
                      value={design.content.awardPrefix}
                      onChange={(e) => patchDesign('content', 'awardPrefix', e.target.value)}
                      className="input-field"
                      placeholder="has successfully completed"
                    />
                  </div>

                  <div>
                    <label className="label">Description</label>
                    <textarea
                      value={design.content.description}
                      onChange={(e) => patchDesign('content', 'description', e.target.value)}
                      className="input-field h-28"
                      placeholder="For outstanding dedication and successful completion of the Career Radar Frontend Development Programme."
                    />
                    <p className="text-xs text-muted mt-1">Leave blank to use each certificate's own description.</p>
                  </div>

                  <div>
                    <label className="label">Criteria / footnote</label>
                    <input
                      value={design.content.criteria}
                      onChange={(e) => patchDesign('content', 'criteria', e.target.value)}
                      className="input-field"
                      placeholder="40 hours · Completed June 2026"
                    />
                  </div>

                  <div>
                    <label className="label">Organisation tagline</label>
                    <input
                      value={design.header.tagline}
                      onChange={(e) => patchDesign('header', 'tagline', e.target.value)}
                      className="input-field"
                      placeholder="Career GPS for Students"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={design.content.showDate !== false}
                      onChange={(e) => patchDesign('content', 'showDate', e.target.checked)}
                      className="w-4 h-4 accent-gold rounded"
                    />
                    <span className="text-sm">Print the issue date</span>
                  </label>
                </div>
              </>
            )}

            {activeTab === 'typography' && (
              <>
                <div>
                  <label className="label">Heading font</label>
                  <select
                    value={typo.headingFont}
                    onChange={(e) => patchDesign('typography', 'headingFont', e.target.value)}
                    className="input-field"
                  >
                    {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div>
                  <label className="label">Body font</label>
                  <select
                    value={typo.bodyFont}
                    onChange={(e) => patchDesign('typography', 'bodyFont', e.target.value)}
                    className="input-field"
                  >
                    {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div>
                  <label className="label">Recipient name font</label>
                  <select
                    value={typo.recipientFont}
                    onChange={(e) => patchDesign('typography', 'recipientFont', e.target.value)}
                    className="input-field"
                  >
                    {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <NumberField
                    label="Recipient size"
                    value={typo.recipientSize}
                    onChange={(v) => patchDesign('typography', 'recipientSize', v)}
                    min={18} max={110} suffix="pt"
                  />
                  <NumberField
                    label="Heading size"
                    value={typo.headingSize}
                    onChange={(v) => patchDesign('typography', 'headingSize', v)}
                    min={8} max={48} suffix="pt"
                  />
                  <NumberField
                    label="Letter spacing"
                    value={typo.letterSpacing}
                    onChange={(v) => patchDesign('typography', 'letterSpacing', v)}
                    min={0} max={24} suffix="px"
                  />
                  <div>
                    <label className="label">Organisation size</label>
                    <input
                      type="number"
                      value={design.header.organizationSize}
                      min={10} max={72}
                      onChange={(e) => patchDesign('header', 'organizationSize', Number(e.target.value))}
                      className="input-field py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={typo.recipientUnderline !== false}
                      onChange={(e) => patchDesign('typography', 'recipientUnderline', e.target.checked)}
                      className="w-4 h-4 accent-gold rounded"
                    />
                    <span className="text-sm">Underline recipient name</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={design.signatures.show !== false}
                      onChange={(e) => patchDesign('signatures', 'show', e.target.checked)}
                      className="w-4 h-4 accent-gold rounded"
                    />
                    <span className="text-sm">Show signature blocks</span>
                  </label>
                </div>

                <ColorField
                  label="Recipient name colour"
                  value={typo.recipientColor || palette.text}
                  onChange={(v) => patchDesign('typography', 'recipientColor', v)}
                />
              </>
            )}

            {activeTab === 'style' && (
              <>
                <ColorField label="Background" value={palette.background} onChange={(v) => patchDesign('palette', 'background', v)} />
                <ColorField label="Accent" value={palette.accent} onChange={(v) => patchDesign('palette', 'accent', v)} />
                <ColorField label="Text" value={palette.text} onChange={(v) => patchDesign('palette', 'text', v)} />
                <ColorField label="Muted text" value={palette.muted} onChange={(v) => patchDesign('palette', 'muted', v)} />
                <ColorField label="Border" value={palette.border} onChange={(v) => patchDesign('palette', 'border', v)} />

                <div className="pt-3 border-t border-border space-y-4">
                  <div>
                    <label className="label">Frame style</label>
                    <div className="grid grid-cols-3 gap-2">
                      {FRAME_STYLES.map((style) => (
                        <button
                          key={style.value}
                          type="button"
                          onClick={() => patchDesign('frame', 'style', style.value)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                            design.frame.style === style.value
                              ? 'border-gold bg-gold/10 text-gold'
                              : 'border-border hover:bg-black/5 text-muted'
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <NumberField
                      label="Thickness"
                      value={design.frame.thickness}
                      onChange={(v) => patchDesign('frame', 'thickness', v)}
                      min={0.5} max={16} step={0.5} suffix="mm"
                    />
                    <NumberField
                      label="Inset"
                      value={design.frame.inset}
                      onChange={(v) => patchDesign('frame', 'inset', v)}
                      min={4} max={40} step={0.5} suffix="mm"
                    />
                    <NumberField
                      label="Corner radius"
                      value={design.frame.radius}
                      onChange={(v) => patchDesign('frame', 'radius', v)}
                      min={0} max={30} suffix="mm"
                    />
                    <div>
                      <label className="label">Frame colour</label>
                      <input
                        type="color"
                        value={design.frame.color || palette.border}
                        onChange={(e) => patchDesign('frame', 'color', e.target.value)}
                        className="h-10 w-full rounded-lg border border-border bg-white cursor-pointer p-1"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={design.frame.ornament !== false}
                      onChange={(e) => patchDesign('frame', 'ornament', e.target.checked)}
                      className="w-4 h-4 accent-gold rounded"
                    />
                    <span className="text-sm">Decorative corner flourishes</span>
                  </label>
                </div>
              </>
            )}

            {activeTab === 'layout' && (
              <>
                <div>
                  <label className="label">Page size</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['A4', 'Letter'].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => patchTemplate('page_size', size)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                          template.page_size === size
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-border hover:bg-black/5 text-muted'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Orientation</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['landscape', 'portrait'].map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => patchTemplate('orientation', o)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-semibold border capitalize transition-colors ${
                          template.orientation === o
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-border hover:bg-black/5 text-muted'
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Text alignment</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['left', 'center', 'right'].map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => patchDesign('content', 'align', a)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize border transition-colors ${
                          design.content.align === a
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-border hover:bg-black/5 text-muted'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-border space-y-3">
                  <NumberField
                    label="Signature spacing"
                    value={design.signatures.gap}
                    onChange={(v) => patchDesign('signatures', 'gap', v)}
                    min={0} max={120} suffix="mm"
                  />
                  <NumberField
                    label="QR code size"
                    value={design.footer.qrSize}
                    onChange={(v) => patchDesign('footer', 'qrSize', v)}
                    min={14} max={60} suffix="mm"
                  />
                  <NumberField
                    label="Logo height"
                    value={design.header.logoHeight}
                    onChange={(v) => patchDesign('header', 'logoHeight', v)}
                    min={0} max={120} suffix="mm"
                  />

                  <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={design.footer.showQr !== false}
                        onChange={(e) => patchDesign('footer', 'showQr', e.target.checked)}
                        className="w-4 h-4 accent-gold rounded"
                      />
                      <span className="text-sm">Print verification QR code</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={design.footer.showCertificateId !== false}
                        onChange={(e) => patchDesign('footer', 'showCertificateId', e.target.checked)}
                        className="w-4 h-4 accent-gold rounded"
                      />
                      <span className="text-sm">Print certificate ID</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={design.footer.showVerifyUrl !== false}
                        onChange={(e) => patchDesign('footer', 'showVerifyUrl', e.target.checked)}
                        className="w-4 h-4 accent-gold rounded"
                      />
                      <span className="text-sm">Print verification URL</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={design.header.showLogo !== false}
                        onChange={(e) => patchDesign('header', 'showLogo', e.target.checked)}
                        className="w-4 h-4 accent-gold rounded"
                      />
                      <span className="text-sm">Show organisation logo</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'media' && (
              <>
                <AssetUpload
                  label="Template background image"
                  hint="Optional. A subtle paper or pattern texture works best."
                  value={template.background_url}
                  onChange={(v) => patchTemplate('background_url', v)}
                  previewHeight={64}
                />

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted">
                    Organisation logos and signature images are attached to each <strong>issued certificate</strong>, so
                    they can change over time without altering past certificates.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Live preview */}
        <div className="flex-1 overflow-y-auto bg-navy-dark/5 p-4 sm:p-6 min-h-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold flex items-center gap-2">
              <FrameIcon size={15} className="text-gold" />
              Live preview
            </p>
            <p className="text-xs text-muted">
              Exactly what the generated PDF will look like
            </p>
          </div>

          <div className="rounded-2xl bg-white p-3 sm:p-5 shadow-sm">
            <CertificatePreview
              design={design}
              values={previewData}
              page={{ size: template.page_size, orientation: template.orientation }}
            />
          </div>

          <p className="text-xs text-muted mt-4 text-center">
            Editing an existing template only affects future certificates. Already-issued
            certificates keep the design they were issued with.
          </p>
        </div>
      </div>
    </div>
  )
}

export { DEFAULT_DESIGN }