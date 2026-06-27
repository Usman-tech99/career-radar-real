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

const productSchema = z.object({
  title: z.string().min(3, "Title is required"),
  category: z.enum(['File', 'Course', 'Template', 'eBook', 'Bundle']),
  description: z.string().optional(),
  price_pkr: z.preprocess((val) => Number(val), z.number().min(0)),
  is_free: z.boolean().default(false),
  is_active: z.boolean().default(true),
  external_link: z.string().optional(),
  whatsapp_number: z.string().optional(),
  bank_details: z.string().optional(),
})

export default function ManageProducts() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: { price_pkr: 0, is_free: false, is_active: true }
  })

  const isFree = watch('is_free')

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (error) toast.error('Failed to fetch products')
    else setProducts(data || [])
    setLoading(false)
  }

  function openModal(item = null) {
    if (item) {
      setEditingId(item.id)
      setValue('title', item.title)
      setValue('category', item.category)
      setValue('description', item.description || '')
      setValue('price_pkr', item.price_pkr || 0)
      setValue('is_free', item.is_free)
      setValue('is_active', item.is_active)
      setValue('external_link', item.external_link || '')
      setValue('whatsapp_number', item.whatsapp_number || '')
      setValue('bank_details', item.bank_details || '')
      setFileUrl(item.file_url || '')
      setThumbnailUrl(item.thumbnail_url || '')
      setPreviewUrl(item.preview_url || '')
    } else {
      setEditingId(null)
      reset()
      setFileUrl('')
      setThumbnailUrl('')
      setPreviewUrl('')
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
    
    // product-files is private, thumbnails is public
    const bucket = type === 'file' ? 'product-files' : 'product-thumbnails'

    try {
      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file)
      if (uploadError) throw uploadError

      if (type === 'file') {
        // We store the raw path for private files so we can generate signed URLs later
        setFileUrl(filePath)
      } else {
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
        if (type === 'thumbnail') setThumbnailUrl(data.publicUrl)
        else setPreviewUrl(data.publicUrl)
      }
      
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
      preview_url: previewUrl,
      posted_by: user.id
    }

    try {
      if (editingId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingId)
        if (error) throw error
        toast.success('Product updated')
      } else {
        const { error } = await supabase.from('products').insert([payload])
        if (error) throw error
        toast.success('Product added')
        await supabase.rpc('increment_total_products') // Handle singleton increment if needed
      }
      setIsModalOpen(false)
      fetchProducts()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function deleteProduct(id) {
    if (!window.confirm('Delete this product?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Deleted')
      fetchProducts()
    }
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Products (Shop)</h1>
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <Plus size={20} /> Add Product
          </button>
        </div>

        {loading ? (
          <div className="skeleton w-full h-64 rounded-2xl"></div>
        ) : products.length === 0 ? (
          <div className="glass-card text-center py-12 text-muted">No products found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(item => (
              <div key={item.id} className="glass-card flex flex-col">
                <SafeImage src={item.thumbnail_url} alt={item.title || 'thumbnail'} className="w-full h-40 object-cover rounded-xl mb-4 border border-border" />
                <div className="flex justify-between items-start mb-2">
                  <span className="badge-gold">{item.category}</span>
                  <span className={`text-xs font-bold ${item.is_free ? 'text-green' : 'text-amber-400'}`}>
                    {item.is_free ? 'FREE' : `PKR ${item.price_pkr}`}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                
                <div className="flex justify-between items-center border-t border-border mt-4 pt-4">
                  <span className={`text-xs ${item.is_active ? 'text-green' : 'text-red-400'}`}>
                    {item.is_active ? 'Active in Shop' : 'Hidden'}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(item)} className="p-2 text-blue-accent hover:bg-blue-500/10 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteProduct(item.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
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
                <h2 className="text-2xl font-bold">{editingId ? 'Edit Product' : 'Add Product'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-white"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Title</label>
                    <input {...register('title')} className="input-field" placeholder="e.g. React Mastery Course" />
                    {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select {...register('category')} className="input-field">
                      <option value="Course">Course</option>
                      <option value="File">File</option>
                      <option value="Template">Template</option>
                      <option value="eBook">eBook</option>
                      <option value="Bundle">Bundle</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea {...register('description')} className="input-field h-24" />
                </div>

                <div className="flex gap-6 p-4 border border-border rounded-xl bg-white/[0.02]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('is_free')} className="w-4 h-4 accent-green rounded" />
                    <span className="text-sm font-bold text-green">This product is FREE</span>
                  </label>
                  {!isFree && (
                    <div className="flex-1">
                      <label className="label text-xs">Price (PKR)</label>
                      <input type="number" {...register('price_pkr')} className="input-field py-2" placeholder="0" />
                    </div>
                  )}
                </div>

                {!isFree && (
                  <div className="grid grid-cols-2 gap-4 p-4 border border-border rounded-xl">
                    <div>
                      <label className="label text-xs text-amber-400">WhatsApp for Payment Proof</label>
                      <input {...register('whatsapp_number')} className="input-field py-2" placeholder="+923..." />
                    </div>
                    <div>
                      <label className="label text-xs text-amber-400">Bank/JazzCash Details</label>
                      <textarea {...register('bank_details')} className="input-field h-20 text-sm" placeholder="Meezan Bank: 123456789" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 border border-border p-4 rounded-xl">
                  <div>
                    <label className="label text-xs">Thumbnail</label>
                    <label className="btn-ghost text-xs cursor-pointer flex justify-center py-2">
                      <Upload size={14} className="mr-1" /> Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'thumbnail')} disabled={uploading} />
                    </label>
                  </div>
                  <div>
                    <label className="label text-xs">Preview Asset</label>
                    <label className="btn-ghost text-xs cursor-pointer flex justify-center py-2">
                      <Upload size={14} className="mr-1" /> Upload
                      <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'preview')} disabled={uploading} />
                    </label>
                  </div>
                  <div>
                    <label className="label text-xs text-red-400">Private File (Paid)</label>
                    <label className="btn-danger text-xs cursor-pointer flex justify-center py-2">
                      <Upload size={14} className="mr-1" /> Secure Upload
                      <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'file')} disabled={uploading} />
                    </label>
                  </div>
                </div>
                
                {(thumbnailUrl || previewUrl || fileUrl) && (
                  <div className="text-xs text-muted space-y-1">
                    {thumbnailUrl && <p>Thumb: {thumbnailUrl.substring(0, 50)}...</p>}
                    {previewUrl && <p>Preview: {previewUrl.substring(0, 50)}...</p>}
                    {fileUrl && <p className="text-red-400">Secure Path: {fileUrl}</p>}
                  </div>
                )}

                <div className="flex gap-6 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('is_active')} className="w-4 h-4 accent-green rounded" />
                    <span className="text-sm">Active (Visible in Shop)</span>
                  </label>
                </div>

                <div className="pt-4 flex justify-end gap-4 border-t border-border mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" className="btn-primary" disabled={uploading}>Save Product</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
