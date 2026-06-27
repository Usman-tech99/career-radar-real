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
import { formatDate } from '../../lib/helpers'

const contentSchema = z.object({
  title: z.string().min(3, "Title is required"),
  category: z.enum(['Roadmap', 'Guide', 'AI Tools', 'Resource Pack', 'Workshop', 'Other']),
  description: z.string().optional(),
  week_label: z.string().optional(),
  external_link: z.string().optional(),
  is_published: z.boolean().default(true),
})

export default function ManageContent() {
  const { user } = useAuth()
  const [contentList, setContentList] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(contentSchema)
  })

  useEffect(() => {
    fetchContent()
  }, [])

  async function fetchContent() {
    const { data, error } = await supabase.from('weekly_content').select('*').order('created_at', { ascending: false })
    if (error) toast.error('Failed to fetch content')
    else setContentList(data || [])
    setLoading(false)
  }

  function openModal(item = null) {
    if (item) {
      setEditingId(item.id)
      setValue('title', item.title)
      setValue('category', item.category)
      setValue('description', item.description || '')
      setValue('week_label', item.week_label || '')
      setValue('external_link', item.external_link || '')
      setValue('is_published', item.is_published)
      setFileUrl(item.file_url || '')
      setThumbnailUrl(item.thumbnail_url || '')
    } else {
      setEditingId(null)
      reset()
      setFileUrl('')
      setThumbnailUrl('')
    }
    setIsModalOpen(true)
  }

  async function handleFileUpload(e, type) {
    const file = e.target.files[0]
    if (!file) return
    
    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`
    const bucket = 'content-files'

    try {
      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file)
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
      
      if (type === 'thumbnail') setThumbnailUrl(data.publicUrl)
      else setFileUrl(data.publicUrl)
      
      toast.success(`${type} uploaded`)
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(data) {
    const payload = {
      ...data,
      file_url: fileUrl,
      thumbnail_url: thumbnailUrl,
      posted_by: user.id
    }

    try {
      if (editingId) {
        const { error } = await supabase.from('weekly_content').update(payload).eq('id', editingId)
        if (error) throw error
        toast.success('Content updated')
      } else {
        const { error } = await supabase.from('weekly_content').insert([payload])
        if (error) throw error
        toast.success('Content added')
      }
      setIsModalOpen(false)
      fetchContent()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function deleteContent(id) {
    if (!window.confirm('Are you sure you want to delete this content?')) return
    const { error } = await supabase.from('weekly_content').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Deleted')
      fetchContent()
    }
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Content</h1>
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <Plus size={20} /> Add Content
          </button>
        </div>

        {loading ? (
          <div className="skeleton w-full h-64 rounded-2xl"></div>
        ) : contentList.length === 0 ? (
          <div className="glass-card text-center py-12 text-muted">No content found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contentList.map(item => (
              <div key={item.id} className="glass-card flex flex-col">
                <SafeImage src={item.thumbnail_url} alt={item.title || 'thumbnail'} className="w-full h-40 object-cover rounded-xl mb-4" />
                <div className="flex justify-between items-start mb-2">
                  <span className="badge-purple">{item.category}</span>
                  <span className={`text-xs ${item.is_published ? 'text-green' : 'text-red-400'}`}>
                    {item.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-muted mb-4 flex-1 line-clamp-2">{item.description}</p>
                
                <div className="flex justify-between items-center border-t border-border pt-4">
                  <span className="text-xs text-muted">{formatDate(item.created_at)}</span>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(item)} className="p-2 text-blue-accent hover:bg-blue-500/10 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteContent(item.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
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
                <h2 className="text-2xl font-bold">{editingId ? 'Edit Content' : 'Add Content'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-white"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Title</label>
                    <input {...register('title')} className="input-field" placeholder="e.g. Master Resume Guide" />
                    {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select {...register('category')} className="input-field">
                      <option value="Roadmap">Roadmap</option>
                      <option value="Guide">Guide</option>
                      <option value="AI Tools">AI Tools</option>
                      <option value="Resource Pack">Resource Pack</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea {...register('description')} className="input-field h-24" />
                </div>

                <div className="grid grid-cols-2 gap-4 border border-border p-4 rounded-xl">
                  <div>
                    <label className="label">Upload Thumbnail (Image)</label>
                    <div className="flex items-center gap-4">
                      <label className="btn-ghost text-sm cursor-pointer flex gap-2">
                        <Upload size={16} /> {uploading ? 'Uploading...' : 'Choose File'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'thumbnail')} disabled={uploading} />
                      </label>
                    </div>
                    {thumbnailUrl && <p className="text-green text-xs mt-2 truncate">Uploaded: {thumbnailUrl}</p>}
                  </div>
                  <div>
                    <label className="label">Upload Content (PDF/ZIP)</label>
                    <div className="flex items-center gap-4">
                      <label className="btn-ghost text-sm cursor-pointer flex gap-2">
                        <Upload size={16} /> {uploading ? 'Uploading...' : 'Choose File'}
                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'file')} disabled={uploading} />
                      </label>
                    </div>
                    {fileUrl && <p className="text-green text-xs mt-2 truncate">Uploaded: {fileUrl}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">External Link (Optional)</label>
                    <input {...register('external_link')} className="input-field" placeholder="https://" />
                  </div>
                  <div>
                    <label className="label">Week Label (Optional)</label>
                    <input {...register('week_label')} className="input-field" placeholder="e.g. Week 12" />
                  </div>
                </div>

                <div className="flex gap-6 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('is_published')} className="w-4 h-4 accent-green rounded" />
                    <span className="text-sm">Published (Visible)</span>
                  </label>
                </div>

                <div className="pt-4 flex justify-end gap-4 border-t border-border mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" className="btn-primary" disabled={uploading}>Save Content</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
