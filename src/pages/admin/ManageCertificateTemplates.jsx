import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Plus, Edit2, Trash2, Copy, Power, PowerOff, LayoutTemplate, Search, Eye, FileText,
} from 'lucide-react'
import CertificateTemplateEditor from '../../components/certificates/CertificateTemplateEditor'
import {
  listTemplates, createTemplate, updateTemplate, duplicateTemplate,
  setTemplateActive, deleteTemplate, templateUsageCount, fetchTemplateStats,
  CERTIFICATE_TYPES, certificateTypeLabel, renderCertificateHtml, previewValues, templateVersion,
} from '../../lib/certificates'
import { normalizeDesign, PAGE_SIZES } from '../../../supabase/functions/generate-certificate-pdf/certificateHtml.js'

const CSS_PX_PER_MM = 96 / 25.4

/** Tiny non-interactive thumbnail built from the same renderer as the PDF. */
function TemplateThumbnail({ template }) {
  const srcDoc = useMemo(() => {
    const dims = (PAGE_SIZES[template.page_size] || PAGE_SIZES.A4)[
      template.orientation === 'portrait' ? 'portrait' : 'landscape'
    ]
    return renderCertificateHtml({
      design: normalizeDesign(template.design),
      values: previewValues(template.design),
      page: { size: template.page_size, orientation: template.orientation },
    }).replace('<html', `<html style="zoom:0.26"`)
  }, [template])

  const dims = (PAGE_SIZES[template.page_size] || PAGE_SIZES.A4)[
    template.orientation === 'portrait' ? 'portrait' : 'landscape'
  ]

  return (
    <div className="relative w-full bg-white rounded-lg overflow-hidden border border-border">
      <div className="pointer-events-none select-none">
        <iframe
          title={template.name}
          srcDoc={srcDoc}
          sandbox=""
          scrolling="no"
          className="border-0 pointer-events-none"
          style={{
            width: dims.w * CSS_PX_PER_MM * 0.26,
            height: dims.h * CSS_PX_PER_MM * 0.26,
          }}
        />
      </div>
      {template.page_size === 'Letter' && (
        <span className="absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0.5 rounded bg-navy/80 text-white font-semibold">
          Letter
        </span>
      )}
      {template.orientation === 'portrait' && (
        <span className="absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0.5 rounded bg-navy/80 text-white font-semibold">
          Portrait
        </span>
      )}
    </div>
  )
}

function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel, busy }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="glass-card w-full max-w-md">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-muted mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={busy} className="btn-ghost text-sm px-4 py-2">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`text-sm px-4 py-2 ${danger ? 'btn-danger' : 'btn-primary'}`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ManageCertificateTemplates() {
  const [templates, setTemplates] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [editorTemplate, setEditorTemplate] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const [rows, templateStats] = await Promise.all([listTemplates(), fetchTemplateStats()])
      setTemplates(rows)
      setStats(templateStats)
    } catch (error) {
      toast.error(error.message || 'Could not load templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const statsById = useMemo(() => {
    const map = {}
    for (const row of stats) map[row.id] = row
    return map
  }, [stats])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return templates.filter((template) => {
      const matchesType = typeFilter === 'all' || template.certificate_type === typeFilter
      const matchesTerm =
        !term ||
        template.name.toLowerCase().includes(term) ||
        (template.description || '').toLowerCase().includes(term)
      return matchesType && matchesTerm
    })
  }, [templates, search, typeFilter])

  function openCreate() {
    setEditorTemplate(null)
    setEditorOpen(true)
  }

  function openEdit(template) {
    setEditorTemplate(template)
    setEditorOpen(true)
  }

  async function handleSave(payload) {
    const { design, ...columns } = payload
    if (editorTemplate?.id) {
      await updateTemplate(editorTemplate.id, { ...columns, design })
      toast.success('Template updated')
    } else {
      await createTemplate({ ...columns, design })
      toast.success('Template created')
    }
    setEditorOpen(false)
    load()
  }

  async function handleToggleActive(template) {
    try {
      await setTemplateActive(template.id, !template.is_active)
      toast.success(template.is_active ? 'Template deactivated' : 'Template activated')
      load()
    } catch (error) {
      toast.error(error.message)
    }
  }

  async function handleDuplicate(template) {
    try {
      const copy = await duplicateTemplate(template.id)
      toast.success(`Created "${copy.name}"`)
      load()
    } catch (error) {
      toast.error(error.message)
    }
  }

  async function handleDelete(template) {
    setBusy(true)
    try {
      const usage = await templateUsageCount(template.id)
      if (usage > 0) {
        toast.error(
          `This template has issued ${usage} certificate${usage === 1 ? '' : 's'}. Deactivate it instead — deleting would break their history.`
        )
        setConfirm(null)
        return
      }
      await deleteTemplate(template.id)
      toast.success('Template deleted')
      setConfirm(null)
      load()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Certificate Templates</h1>
          <p className="text-sm text-muted mt-1">
            Design once, then reuse the template for every issuance.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New template
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="input-field pl-10 py-2.5"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input-field py-2.5 sm:w-56"
        >
          <option value="all">All types</option>
          {CERTIFICATE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-72 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card text-center py-16">
          <LayoutTemplate size={44} className="mx-auto text-muted opacity-40 mb-4" />
          <h3 className="font-bold text-lg mb-1">
            {templates.length === 0 ? 'No templates yet' : 'No templates match your filters'}
          </h3>
          <p className="text-sm text-muted mb-6 max-w-md mx-auto">
            {templates.length === 0
              ? 'Create your first certificate template to start issuing certificates.'
              : 'Try a different search term or clear the type filter.'}
          </p>
          {templates.length === 0 && (
            <button type="button" onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
              <Plus size={18} /> Create template
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((template) => {
            const usage = statsById[template.id]
            const issued = usage?.issued_count || 0

            return (
              <div key={template.id} className="glass-card flex flex-col gap-4">
                <TemplateThumbnail template={template} />

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-bold leading-snug">{template.name}</h3>
                    <span
                      className={`shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        template.is_active
                          ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30'
                          : 'text-slate-500 bg-slate-500/10 border-slate-500/30'
                      }`}
                    >
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="badge-gold">{certificateTypeLabel(template.certificate_type)}</span>
                    <span>{template.orientation === 'portrait' ? 'Portrait' : 'Landscape'}</span>
                    <span>·</span>
                    <span title="Design revision. Certificates freeze the version they were issued under.">
                      v{templateVersion(template)}
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <FileText size={11} />
                      {issued} issued
                    </span>
                  </div>

                  {template.description && (
                    <p className="text-xs text-muted mt-2 line-clamp-2">{template.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => openEdit(template)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-black/5 transition-colors"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(template)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-black/5 transition-colors"
                    title="Duplicate this template"
                  >
                    <Copy size={14} /> Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(template)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-black/5 transition-colors"
                    title={template.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {template.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                    {template.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirm({
                        template,
                        message: issued
                          ? `This template has issued ${issued} certificate${issued === 1 ? '' : 's'}, so it cannot be deleted. Deactivate it to stop new issuances while keeping history intact.`
                          : 'This cannot be undone. The template will be permanently removed.',
                      })
                    }
                    className="ml-auto p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                    title={issued ? 'Templates in use cannot be deleted' : 'Delete template'}
                    aria-label="Delete template"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {issued > 0 && (
                  <p className="text-[11px] text-muted flex items-center gap-1.5 -mt-1">
                    <Eye size={11} />
                    In use by {issued} certificate{issued === 1 ? '' : 's'} — deletion is disabled
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {editorOpen && (
        <CertificateTemplateEditor
          initialTemplate={editorTemplate}
          onClose={() => setEditorOpen(false)}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        title={`Delete "${confirm?.template?.name}"?`}
        message={confirm?.message}
        confirmLabel="Delete template"
        danger
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => handleDelete(confirm.template)}
      />
    </div>
  )
}