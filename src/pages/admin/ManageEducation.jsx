import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import SafeImage from '../../components/ui/SafeImage'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, X, Upload } from 'lucide-react'
import { formatDate } from '../../lib/helpers'

const educationSchema = z.object({
  title: z.string().min(3, "Title is required"),
  type: z.enum(['Course', 'Book', 'Guide', 'Workshop']),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  description: z.string().optional(),
  is_free: z.boolean().default(true),
  free_access_url: z.string().optional(),
  product_id: z.string().uuid().optional().or(z.literal('')),
  duration_label: z.string().optional(),
  topics_covered: z.string().optional(),
  is_published: z.boolean().default(true),
  sort_order: z.preprocess((val) => Number(val), z.number().default(99)),
})

export default function ManageEducation() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState('')

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(educationSchema),
    defaultValues: { is_free: true, is_published: true, sort_order: 99 }
  })

  const isFree = watch('is_free')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    // Fetch education items
    const { data: eduData, error: eduError } = await supabase.from('education_items').select('*, products(title)').order('sort_order', { ascending: true })
    if (eduError) toast.error('Failed to fetch education items')
    else setItems(eduData || [])

    // Fetch paid products to link
    const { data: prodData } = await supabase.from('products').select('id, title').eq('is_free', false)
    if (prodData) setProducts(prodData)

    setLoading(false)
  }

  function openModal(item = null) {
    if (item) {
      setEditingId(item.id)
      setValue('title', item.title)
      setValue('type', item.type)
      setValue('level', item.level)
      setValue('description', item.description || '')
      setValue('is_free', item.is_free)
      setValue('free_access_url', item.free_access_url || '')
      setValue('product_id', item.product_id || '')
      setValue('duration_label', item.duration_label || '')
      setValue('topics_covered', item.topics_covered ? item.topics_covered.join(', ') : '')
      setValue('is_published', item.is_published)
      setValue('sort_order', item.sort_order)
      setThumbnailUrl(item.thumbnail_url || '')
    } else {
      setEditingId(null)
      reset()
      setThumbnailUrl('')
    }
    setIsModalOpen(true)
  }

  async function handleThumbnailUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    
    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`
    const bucket = 'education-thumbnails'

    try {
      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file)
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
      setThumbnailUrl(data.publicUrl)
      toast.success('Thumbnail uploaded')
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(data) {
    const payload = {
      ...data,
      thumbnail_url: thumbnailUrl,
      topics_covered: data.topics_covered ? data.topics_covered.split(',').map(t => t.trim()) : [],
      product_id: data.product_id || null // Ensure empty string becomes null for UUID foreign key
    }

    try {
      if (editingId) {
        const { error } = await supabase.from('education_items').update(payload).eq('id', editingId)
        if (error) throw error
        toast.success('Education item updated')
      } else {
        const { error } = await supabase.from('education_items').insert([payload])
        if (error) throw error
        toast.success('Education item added')
      }
      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function deleteItem(id) {
    if (!window.confirm('Delete this education item?')) return
    const { error } = await supabase.from('education_items').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Deleted')
      fetchData()
    }
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Education</h1>
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <Plus size={20} /> Add Item
          </button>
        </div>

        {loading ? (
          <div className="skeleton w-full h-64 rounded-2xl"></div>
        ) : items.length === 0 ? (
          <div className="glass-card text-center py-12 text-muted">No education items found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <div key={item.id} className="glass-card flex flex-col">
                <SafeImage src={item.thumbnail_url} alt={item.title || 'thumbnail'} className="w-full h-40 object-cover rounded-xl mb-4 border border-border" />
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2">
                    <span className="badge-blue">{item.type}</span>
                    <span className="badge-purple">{item.level}</span>
                  </div>
                  <span className={`text-xs font-bold ${item.is_free ? 'text-green' : 'text-amber-400'}`}>
                    {item.is_free ? 'FREE' : 'PAID (Products)'}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                {item.products && <p className="text-xs text-amber-400 mb-2">Linked to: {item.products.title}</p>}
                
                <div className="flex justify-between items-center border-t border-border mt-auto pt-4">
                  <span className={`text-xs ${item.is_published ? 'text-green' : 'text-red-400'}`}>
                    {item.is_published ? 'Published' : 'Draft'}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(item)} className="p-2 text-blue-accent hover:bg-blue-500/10 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
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
                <h2 className="text-2xl font-bold">{editingId ? 'Edit Education Item' : 'Add Education Item'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-white"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Title</label>
                    <input {...register('title')} className="input-field" placeholder="e.g. Intro to UI/UX" />
                    {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label">Type</label>
                      <select {...register('type')} className="input-field">
                        <option value="Course">Course</option>
                        <option value="Book">Book</option>
                        <option value="Guide">Guide</option>
                        <option value="Workshop">Workshop</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Level</label>
                      <select {...register('level')} className="input-field">
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea {...register('description')} className="input-field h-24" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-border p-4 rounded-xl">
                  <div>
                    <label className="label">Upload Thumbnail</label>
                    <div className="flex items-center gap-4">
                      <label className="btn-ghost text-sm cursor-pointer flex gap-2">
                        <Upload size={16} /> {uploading ? 'Uploading...' : 'Choose Image'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={uploading} />
                      </label>
                    </div>
                    {thumbnailUrl && <p className="text-green text-xs mt-2 truncate">Uploaded: {thumbnailUrl.substring(0, 30)}...</p>}
                  </div>
                  <div>
                    <label className="label">Sort Order (Lowest first)</label>
                    <input type="number" {...register('sort_order')} className="input-field" />
                  </div>
                </div>

                <div className="flex flex-col gap-4 p-4 border border-border rounded-xl bg-white/[0.02]">
                  <label className="flex items-center gap-2 cursor-pointer border-b border-border pb-4">
                    <input type="checkbox" {...register('is_free')} className="w-5 h-5 accent-green rounded" />
                    <span className="font-bold text-lg">This education resource is FREE</span>
                  </label>
                  
                  {isFree ? (
                    <div>
                      <label className="label text-green">Free Access URL (e.g. YouTube playlist link)</label>
                      <input {...register('free_access_url')} className="input-field border-green/30" placeholder="https://youtube.com/..." />
                    </div>
                  ) : (
                    <div>
                      <label className="label text-amber-400">Link to Paid Product</label>
                      <select {...register('product_id')} className="input-field border-amber-400/30">
                        <option value="">-- Select a Paid Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Duration Label</label>
                    <input {...register('duration_label')} className="input-field" placeholder="e.g. 4 Weeks or 10 Hours" />
                  </div>
                  <div>
                    <label className="label">Topics (comma separated)</label>
                    <input {...register('topics_covered')} className="input-field" placeholder="Figma, Wireframing" />
                  </div>
                </div>

                <div className="flex gap-6 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('is_published')} className="w-4 h-4 accent-green rounded" />
                    <span className="text-sm">Published</span>
                  </label>
                </div>

                <div className="pt-4 flex justify-end gap-4 border-t border-border mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" className="btn-primary" disabled={uploading}>Save Education</button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  )
}
