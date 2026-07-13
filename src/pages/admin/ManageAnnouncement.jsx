import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Save, Eye, X, Upload } from 'lucide-react'
import AnnouncementPopup from '../../components/AnnouncementPopup'

const STORAGE_BUCKET = 'content-files'

const defaultContent = {
  headline: '',
  subheading: '',
  bodyText: '',
  imageUrl: '',
  linkUrl: '',
  publishedDate: '',
  cardHeadline: '',
  cardParagraph: '',
  cardBannerText: '',
  cardWarningText: '',
  bgImageUrl: '',
}

export default function ManageAnnouncement() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadTarget, setUploadTarget] = useState(null)

  useEffect(() => { fetchAnnouncement() }, [])

  async function fetchAnnouncement() {
    const { data, error } = await supabase.from('announcements').select('*').eq('is_active', true).order('id', { ascending: false }).limit(1).single()
    if (error && error.code !== 'PGRST116') toast.error('Failed to load announcement')
    setSettings(data || { content: { ...defaultContent }, is_active: true, show_on_entry: true, show_on_exit: true })
    setLoading(false)
  }

  function updateContent(field, value) {
    setSettings(prev => ({ ...prev, content: { ...prev.content, [field]: value } }))
  }

  function update(field, value) {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const filename = `announcement-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filename, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename)
      const url = urlData?.publicUrl || ''
      if (uploadTarget === 'bg') updateContent('bgImageUrl', url)
      else updateContent('imageUrl', url)
      toast.success('Image uploaded')
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      setUploadTarget(null)
    }
  }

  async function handleSave() {
    const msg = settings.content?.headline?.trim()
    if (!msg) return toast.error('Headline is required')
    setSaving(true)
    try {
      if (settings.id) {
        const { error } = await supabase.from('announcements').update({
          content: settings.content,
          is_active: settings.is_active,
          show_on_entry: settings.show_on_entry,
          show_on_exit: settings.show_on_exit,
        }).eq('id', settings.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('announcements').insert([{
          content: settings.content,
          is_active: settings.is_active,
          show_on_entry: settings.show_on_entry,
          show_on_exit: settings.show_on_exit,
        }])
        if (error) throw error
      }
      toast.success('Announcement saved')
      fetchAnnouncement()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const c = settings?.content || defaultContent

  if (loading) return <div className="skeleton w-full h-64 rounded-2xl" />

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Announcement</h1>
        <div className="flex gap-3">
          <button onClick={() => setPreview(true)} className="btn-ghost flex items-center gap-2">
            <Eye size={18} /> Preview
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={18} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="glass-card p-8 max-w-3xl space-y-6">
        {/* Images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Logo / University Image</label>
            {c.imageUrl ? (
              <div className="relative group">
                <img src={c.imageUrl} alt="" className="w-full h-24 object-contain rounded-xl border border-border bg-black/10" />
                <button onClick={() => updateContent('imageUrl', '')} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"><X size={14} /></button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-green/50" onClick={() => { setUploadTarget('logo'); document.getElementById('ann-upload').click() }}>
                <span className="text-xs text-muted">{uploading && uploadTarget === 'logo' ? 'Uploading...' : 'Upload logo'}</span>
              </div>
            )}
          </div>
          <div>
            <label className="label">Background Image (optional)</label>
            {c.bgImageUrl ? (
              <div className="relative group">
                <img src={c.bgImageUrl} alt="" className="w-full h-24 object-cover rounded-xl border border-border" />
                <button onClick={() => updateContent('bgImageUrl', '')} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"><X size={14} /></button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-green/50" onClick={() => { setUploadTarget('bg'); document.getElementById('ann-upload').click() }}>
                <span className="text-xs text-muted">{uploading && uploadTarget === 'bg' ? 'Uploading...' : 'Upload background'}</span>
              </div>
            )}
          </div>
        </div>
        <input id="ann-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />

        {/* Right column */}
        <div>
          <label className="label">Headline</label>
          <input value={c.headline} onChange={e => updateContent('headline', e.target.value)} className="input-field" placeholder="Selected the Wrong Program Preference?" />
        </div>
        <div>
          <label className="label">Subheading</label>
          <input value={c.subheading} onChange={e => updateContent('subheading', e.target.value)} className="input-field" placeholder="Update It Before the Final Deadline!" />
        </div>
        <div>
          <label className="label">Body Text</label>
          <textarea value={c.bodyText} onChange={e => updateContent('bodyText', e.target.value)} className="input-field h-28" placeholder="Full announcement details..." />
        </div>

        <hr className="border-border" />

        {/* Left card fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Card Headline</label>
            <input value={c.cardHeadline} onChange={e => updateContent('cardHeadline', e.target.value)} className="input-field" placeholder="SELECTED WRONG PREFERENCE?" />
          </div>
          <div>
            <label className="label">Published Date</label>
            <input value={c.publishedDate} onChange={e => updateContent('publishedDate', e.target.value)} className="input-field" placeholder="July 13, 2026" />
          </div>
        </div>
        <div>
          <label className="label">Card Paragraph</label>
          <textarea value={c.cardParagraph} onChange={e => updateContent('cardParagraph', e.target.value)} className="input-field h-20" placeholder="Small description inside the card..." />
        </div>
        <div>
          <label className="label">Card Banner Text <span className="text-muted text-xs">(use <span className="text-yellow-400">[highlighted yellow]...[/highlighted yellow]</span> for yellow highlight)</span></label>
          <input value={c.cardBannerText} onChange={e => updateContent('cardBannerText', e.target.value)} className="input-field" placeholder="This is your [highlighted yellow]last opportunity[/highlighted yellow] to change." />
        </div>
        <div>
          <label className="label">Card Warning Text <span className="text-muted text-xs">(use <span className="text-red-400">[red bold]...[/red bold]</span> for red bold)</span></label>
          <input value={c.cardWarningText} onChange={e => updateContent('cardWarningText', e.target.value)} className="input-field" placeholder="You will [red bold]no longer have the option[/red bold] to update." />
        </div>
        <div>
          <label className="label">Link URL</label>
          <input value={c.linkUrl} onChange={e => updateContent('linkUrl', e.target.value)} className="input-field" placeholder="https://admission.uet.edu.pk" />
        </div>

        <hr className="border-border" />

        <div className="flex flex-wrap gap-6 p-4 border border-border rounded-xl">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={settings.is_active} onChange={e => update('is_active', e.target.checked)} className="w-4 h-4 accent-green rounded" />
            <span className="text-sm font-bold text-green">Active</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={settings.show_on_entry} onChange={e => update('show_on_entry', e.target.checked)} className="w-4 h-4 accent-green rounded" />
            <span className="text-sm">Show on Entry</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={settings.show_on_exit} onChange={e => update('show_on_exit', e.target.checked)} className="w-4 h-4 accent-green rounded" />
            <span className="text-sm">Show on Exit Intent</span>
          </label>
        </div>
      </div>

      {preview && (
        <AnnouncementPopup
          content={c}
          show={true}
          onClose={() => setPreview(false)}
        />
      )}
    </div>
  )
}