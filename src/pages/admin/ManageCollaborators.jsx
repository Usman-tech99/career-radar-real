import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import AdminSidebar from '../../components/layout/AdminSidebar'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import SafeImage from '../../components/ui/SafeImage'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, X, Upload } from 'lucide-react'

const collabSchema = z.object({
  name: z.string().min(2, "Name is required"),
  collaboration_type: z.enum(['Partner','Sponsor','Affiliate','Friend']),
  description: z.string().optional(),
  website_url: z.string().optional(),
  youtube_url: z.string().optional(),
  whatsapp_url: z.string().optional(),
  instagram_url: z.string().optional(),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sort_order: z.preprocess((val) => Number(val), z.number().default(99)),
})

export default function ManageCollaborators() {
  const { user } = useAuth()
  const [collabs, setCollabs] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(collabSchema),
    defaultValues: { is_active: true, is_featured: false, sort_order: 99 }
  })

  useEffect(() => {
    fetchCollabs()
  }, [])

  async function fetchCollabs() {
    const { data, error } = await supabase.from('collaborators').select('*').order('sort_order', { ascending: true })
    if (error) toast.error('Failed to fetch collaborators')
    else setCollabs(data || [])
    setLoading(false)
  }

  function openModal(item = null) {
    if (item) {
      setEditingId(item.id)
      setValue('name', item.name)
      setValue('collaboration_type', item.collaboration_type)
      setValue('description', item.description || '')
      setValue('website_url', item.website_url || '')
      setValue('youtube_url', item.youtube_url || '')
      setValue('whatsapp_url', item.whatsapp_url || '')
      setValue('instagram_url', item.instagram_url || '')
      setValue('is_featured', item.is_featured)
      setValue('is_active', item.is_active)
      setValue('sort_order', item.sort_order)
      setLogoUrl(item.logo_url || '')
    } else {
      setEditingId(null)
      reset()
      setLogoUrl('')
    }
    setIsModalOpen(true)
  }

  async function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    
    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`
    const bucket = 'collaborator-logos'

    try {
      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file)
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
      setLogoUrl(data.publicUrl)
      toast.success('Logo uploaded')
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(data) {
    const payload = { ...data, logo_url: logoUrl }

    try {
      if (editingId) {
        const { error } = await supabase.from('collaborators').update(payload).eq('id', editingId)
        if (error) throw error
        toast.success('Collaborator updated')
      } else {
        const { error } = await supabase.from('collaborators').insert([payload])
        if (error) throw error
        toast.success('Collaborator added')
      }
      setIsModalOpen(false)
      fetchCollabs()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function deleteCollab(id) {
    if (!window.confirm('Delete this collaborator?')) return
    const { error } = await supabase.from('collaborators').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Deleted')
      fetchCollabs()
    }
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Collaborators</h1>
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <Plus size={20} /> Add Partner
          </button>
        </div>

        {loading ? (
          <div className="skeleton w-full h-64 rounded-2xl"></div>
        ) : collabs.length === 0 ? (
          <div className="glass-card text-center py-12 text-muted">No collaborators found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collabs.map(item => (
              <div key={item.id} className="glass-card flex flex-col relative overflow-hidden">
                {item.is_featured && (
                  <div className="absolute top-0 right-0 bg-gold text-[#07070C] text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                    FEATURED
                  </div>
                )}
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-white/[0.02] border border-border flex items-center justify-center shrink-0 overflow-hidden p-2">
                    <SafeImage src={item.logo_url} alt={item.name || 'logo'} className="max-w-full max-h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{item.name}</h3>
                    <span className="badge-purple mt-1">{item.collaboration_type}</span>
                  </div>
                </div>
                
                <p className="text-sm text-muted mb-4 flex-1 line-clamp-2">{item.description}</p>
                
                <div className="flex justify-between items-center border-t border-border mt-auto pt-4">
                  <span className={`text-xs ${item.is_active ? 'text-green' : 'text-red-400'}`}>
                    {item.is_active ? 'Active' : 'Hidden'}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(item)} className="p-2 text-blue-accent hover:bg-blue-500/10 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteCollab(item.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingId ? 'Edit Partner' : 'Add Partner'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-white"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Name / Brand</label>
                    <input {...register('name')} className="input-field" placeholder="e.g. AWS" />
                    {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="label">Type</label>
                    <select {...register('collaboration_type')} className="input-field">
                      <option value="Partner">Partner</option>
                      <option value="Sponsor">Sponsor</option>
                      <option value="Affiliate">Affiliate</option>
                      <option value="Friend">Friend of Community</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Description (Optional)</label>
                  <textarea {...register('description')} className="input-field h-20" />
                </div>

                <div className="grid grid-cols-2 gap-4 border border-border p-4 rounded-xl">
                  <div>
                    <label className="label">Upload Logo</label>
                    <div className="flex items-center gap-4">
                      <label className="btn-ghost text-sm cursor-pointer flex gap-2">
                        <Upload size={16} /> {uploading ? 'Uploading...' : 'Choose Image'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                      </label>
                    </div>
                    {logoUrl && <p className="text-green text-xs mt-2 truncate">Uploaded: {logoUrl.substring(0,30)}...</p>}
                  </div>
                  <div>
                    <label className="label">Sort Order</label>
                    <input type="number" {...register('sort_order')} className="input-field" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Website URL</label>
                    <input {...register('website_url')} className="input-field" placeholder="https://" />
                  </div>
                  <div>
                    <label className="label">WhatsApp Group/Contact</label>
                    <input {...register('whatsapp_url')} className="input-field" placeholder="https://" />
                  </div>
                  <div>
                    <label className="label">YouTube URL</label>
                    <input {...register('youtube_url')} className="input-field" placeholder="https://" />
                  </div>
                  <div>
                    <label className="label">Instagram URL</label>
                    <input {...register('instagram_url')} className="input-field" placeholder="https://" />
                  </div>
                </div>

                <div className="flex gap-6 mt-4 p-4 border border-border rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('is_featured')} className="w-4 h-4 accent-green rounded" />
                    <span className="text-sm font-bold text-gold">Featured (Gold Border)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('is_active')} className="w-4 h-4 accent-green rounded" />
                    <span className="text-sm">Active</span>
                  </label>
                </div>

                <div className="pt-4 flex justify-end gap-4 border-t border-border mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" className="btn-primary" disabled={uploading}>Save Collaborator</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
