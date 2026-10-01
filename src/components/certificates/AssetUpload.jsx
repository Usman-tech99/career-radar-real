import { useRef, useState } from 'react'
import { Upload, X, ImageOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const BUCKET = 'certificate-assets'
const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

/**
 * Uploads a logo/signature/background image into the `certificate-assets` bucket
 * and returns its permanent public URL.
 *
 * A durable public URL is used rather than a signed one because these URLs are
 * frozen into `template_snapshot` at issuance and re-fetched every time a PDF is
 * regenerated. A signed URL would expire and silently break every certificate
 * issued against that template. The bucket is publicly readable but writable
 * only by admins (see the storage policies in the certificates migration), which
 * matches the fact that the artwork appears on certificates anyone can verify.
 */
export default function AssetUpload({
  value,
  onChange,
  label = 'Upload image',
  hint = 'PNG, JPG, WEBP or SVG · max 2 MB',
  previewHeight = 56,
  bucket = BUCKET,
  className = '',
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file) {
    if (!file) return

    if (!ALLOWED.includes(file.type)) {
      toast.error('Unsupported file type. Use PNG, JPG, WEBP or SVG.')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('That image is larger than 2 MB.')
      return
    }

    setUploading(true)
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `certificates/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`

      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
        contentType: file.type,
        upsert: false,
      })
      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path)
      if (!publicData?.publicUrl) throw new Error('Could not resolve the uploaded image URL')

      onChange(publicData.publicUrl)
      toast.success(`${label.replace('Upload', 'Image')} uploaded`)
    } catch (error) {
      toast.error(error.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={className}>
      <label className="label">{label}</label>

      <div className="flex items-start gap-4">
        <div
          className="flex items-center justify-center rounded-xl border border-border bg-white/40 shrink-0 overflow-hidden"
          style={{ width: previewHeight * 1.6, height: previewHeight }}
        >
          {value ? (
            <img src={value} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <ImageOff size={18} className="text-muted opacity-60" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn-ghost text-sm px-4 py-2 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={15} />
              {uploading ? 'Uploading…' : 'Choose file'}
            </button>

            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                title="Remove image"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <p className="text-xs text-muted mt-2">{hint}</p>

          {value && (
            <p className="text-[11px] text-muted/80 mt-1 truncate font-mono" title={value}>
              {value}
            </p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(',')}
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
        disabled={uploading}
      />
    </div>
  )
}