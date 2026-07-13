import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Save, Eye, X } from 'lucide-react'

export default function ManagePopup() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)

  useEffect(() => { fetchPopup() }, [])

  async function fetchPopup() {
    const { data, error } = await supabase.from('popup_settings').select('*').limit(1).single()
    if (error && error.code !== 'PGRST116') toast.error('Failed to load popup settings')
    setSettings(data || { image_url: '', message: '', link_url: '', is_active: true, show_on_entry: true, show_on_exit: true })
    setLoading(false)
  }

  function update(field, value) {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!settings.message.trim()) return toast.error('Message is required')
    setSaving(true)
    try {
      if (settings.id) {
        const { error } = await supabase.from('popup_settings').update({
          image_url: settings.image_url,
          message: settings.message,
          link_url: settings.link_url,
          is_active: settings.is_active,
          show_on_entry: settings.show_on_entry,
          show_on_exit: settings.show_on_exit,
        }).eq('id', settings.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('popup_settings').insert([{
          image_url: settings.image_url,
          message: settings.message,
          link_url: settings.link_url,
          is_active: settings.is_active,
          show_on_entry: settings.show_on_entry,
          show_on_exit: settings.show_on_exit,
        }])
        if (error) throw error
      }
      toast.success('Popup settings saved')
      fetchPopup()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="skeleton w-full h-64 rounded-2xl" />

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Popup</h1>
        <div className="flex gap-3">
          <button onClick={() => setPreview(true)} className="btn-ghost flex items-center gap-2">
            <Eye size={18} /> Preview
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={18} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="glass-card p-8 max-w-2xl space-y-6">
        <div>
          <label className="label">Image URL (optional)</label>
          <input value={settings.image_url} onChange={e => update('image_url', e.target.value)} className="input-field" placeholder="https://example.com/popup-image.jpg" />
          {settings.image_url && (
            <img src={settings.image_url} alt="preview" className="mt-2 w-full max-h-48 object-cover rounded-xl" onError={e => e.target.style.display = 'none'} />
          )}
        </div>

        <div>
          <label className="label">Message Text</label>
          <textarea value={settings.message} onChange={e => update('message', e.target.value)} className="input-field h-24" placeholder="Announcement or promotional message..." />
        </div>

        <div>
          <label className="label">Link URL (optional)</label>
          <input value={settings.link_url} onChange={e => update('link_url', e.target.value)} className="input-field" placeholder="https://..." />
        </div>

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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPreview(false)}>
          <div className="glass-card w-full max-w-md relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreview(false)} className="absolute top-4 right-4 text-muted hover:text-white z-10"><X size={24} /></button>
            {settings.image_url && <img src={settings.image_url} alt="" className="w-full h-48 object-cover rounded-t-xl" />}
            <div className="p-6">
              <p className="text-white text-lg leading-relaxed">{settings.message}</p>
              {settings.link_url && (
                <a href={settings.link_url} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center gap-2 mt-4">
                  Learn More
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
