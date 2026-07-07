import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import SafeImage from '../../components/ui/SafeImage'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, X, Upload, GraduationCap } from 'lucide-react'
import { formatDate } from '../../lib/helpers'

const scholarshipSchema = z.object({
  title: z.string().min(3, "Title is required"),
  provider: z.string().min(2, "Provider is required"),
  coverage: z.enum(['Fully Funded', 'Partial Tuition', 'Monthly Stipend', 'Other']),
  country: z.string().min(2, "Country is required"),
  deadline: z.string().optional(),
  description: z.string().optional(),
  eligibility: z.string().optional(),
  apply_url: z.string().url("Must be a valid URL"),
})

const STORAGE_BUCKET = 'scholarship-logos'

export default function ManageScholarships() {
  const { user } = useAuth()
  const [scholarships, setScholarships] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState(null)
  const [uploading, setUploading] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(scholarshipSchema)
  })

  useEffect(() => {
    fetchScholarships()
  }, [])

  useEffect(() => {
    return () => { if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  async function fetchScholarships() {
    const { data, error } = await supabase.from('scholarships').select('*').order('created_at', { ascending: false })
    if (error) toast.error('Failed to fetch scholarships')
    else setScholarships(data || [])
    setLoading(false)
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    setSelectedFile(file)
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function openModal(item = null) {
    if (item) {
      setEditingId(item.id)
      setValue('title', item.title)
      setValue('provider', item.provider)
      setValue('coverage', item.coverage)
      setValue('country', item.country)
      setValue('deadline', item.deadline || '')
      setValue('description', item.description || '')
      setValue('eligibility', item.eligibility || '')
      setValue('apply_url', item.apply_url)
      setExistingImageUrl(item.image_url || null)
      setPreviewUrl(item.image_url || null)
      setSelectedFile(null)
    } else {
      setEditingId(null)
      reset()
      setExistingImageUrl(null)
      setPreviewUrl(null)
      setSelectedFile(null)
    }
    setIsModalOpen(true)
  }

  async function uploadImage(file) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const filename = `scholarship-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filename, file, { contentType: file.type })
    if (uploadError) throw new Error(uploadError.message || 'Failed to upload image')
    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename)
    return urlData?.publicUrl || null
  }

  async function onSubmit(data) {
    let imageUrl = existingImageUrl
    if (selectedFile) {
      setUploading(true)
      try { imageUrl = await uploadImage(selectedFile) }
      catch (err) { toast.error(err.message); setUploading(false); return }
      finally { setUploading(false) }
    }
    const payload = { ...data, image_url: imageUrl, deadline: data.deadline || null }
    try {
      if (editingId) {
        const { error } = await supabase.from('scholarships').update(payload).eq('id', editingId)
        if (error) throw error
        toast.success('Scholarship updated')
      } else {
        const { error } = await supabase.from('scholarships').insert([payload])
        if (error) throw error
        toast.success('Scholarship added')
      }
      setIsModalOpen(false)
      fetchScholarships()
    } catch (err) { toast.error(err.message) }
  }

  async function deleteScholarship(id) {
    if (!window.confirm('Delete this scholarship?')) return
    const { error } = await supabase.from('scholarships').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Deleted'); fetchScholarships() }
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <GraduationCap className="text-green" /> Manage Scholarships
          </h1>
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <Plus size={20} /> Add Scholarship
          </button>
        </div>

        {loading ? (
          <div className="skeleton w-full h-64 rounded-2xl" />
        ) : scholarships.length === 0 ? (
          <div className="glass-card text-center py-12 text-muted">No scholarships yet.</div>
        ) : (
          <div className="glass-card overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-[#94A3B8] font-medium">Logo</th>
                  <th className="p-4 text-[#94A3B8] font-medium">Title</th>
                  <th className="p-4 text-[#94A3B8] font-medium">Provider</th>
                  <th className="p-4 text-[#94A3B8] font-medium">Coverage</th>
                  <th className="p-4 text-[#94A3B8] font-medium">Country</th>
                  <th className="p-4 text-[#94A3B8] font-medium">Deadline</th>
                  <th className="p-4 text-right text-[#94A3B8] font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scholarships.map(item => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                    <td className="p-4">
                      <SafeImage src={item.image_url} alt={item.title} className="w-10 h-10 rounded-lg object-cover" />
                    </td>
                    <td className="p-4 font-medium">{item.title}</td>
                    <td className="p-4">{item.provider}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.coverage === 'Fully Funded' ? 'bg-green/20 text-green' :
                        item.coverage === 'Partial Tuition' ? 'bg-gold/20 text-gold' :
                        item.coverage === 'Monthly Stipend' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-white/10 text-white'
                      }`}>{item.coverage}</span>
                    </td>
                    <td className="p-4 text-sm text-muted">{item.country}</td>
                    <td className="p-4 text-sm text-muted">{item.deadline ? formatDate(item.deadline) : '—'}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => openModal(item)} className="p-2 text-blue-accent hover:bg-blue-500/10 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => deleteScholarship(item.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingId ? 'Edit Scholarship' : 'Add Scholarship'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-white"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Title</label>
                    <input {...register('title')} className="input-field" placeholder="e.g. Chevening Scholarship 2026" />
                    {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
                  </div>
                  <div>
                    <label className="label">Provider</label>
                    <input {...register('provider')} className="input-field" placeholder="e.g. British Council" />
                    {errors.provider && <p className="text-red-400 text-sm mt-1">{errors.provider.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Coverage</label>
                    <select {...register('coverage')} className="input-field">
                      <option value="Fully Funded">Fully Funded</option>
                      <option value="Partial Tuition">Partial Tuition</option>
                      <option value="Monthly Stipend">Monthly Stipend</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.coverage && <p className="text-red-400 text-sm mt-1">{errors.coverage.message}</p>}
                  </div>
                  <div>
                    <label className="label">Country</label>
                    <input {...register('country')} className="input-field" placeholder="e.g. United Kingdom" />
                    {errors.country && <p className="text-red-400 text-sm mt-1">{errors.country.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Deadline</label>
                    <input type="date" {...register('deadline')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Apply URL</label>
                    <input {...register('apply_url')} className="input-field" placeholder="https://" />
                    {errors.apply_url && <p className="text-red-400 text-sm mt-1">{errors.apply_url.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="label">Eligibility / Requirements</label>
                  <textarea {...register('eligibility')} className="input-field h-20" placeholder="CGPA > 3.5, IELTS 6.5..." />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea {...register('description')} className="input-field h-24" placeholder="Full details about this opportunity..." />
                </div>

                <div>
                  <label className="label">Logo / Banner Image</label>
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      {previewUrl ? (
                        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white/[0.05]">
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-white/[0.05] flex items-center justify-center border-2 border-dashed border-white/[0.1]">
                          <GraduationCap size={24} className="text-muted" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] transition-colors text-sm font-medium">
                        <Upload size={16} /> {selectedFile ? 'Change' : 'Choose File'}
                        <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                      </label>
                      {selectedFile && <button type="button" onClick={() => { setSelectedFile(null); setPreviewUrl(existingImageUrl) }} className="ml-2 text-xs text-red-400 hover:underline">Remove</button>}
                      <p className="text-[10px] text-muted mt-1">PNG, JPG, WEBP. Max 5MB.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-4 border-t border-border mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" className="btn-primary flex items-center gap-2" disabled={uploading}>
                    {uploading ? <><span className="animate-spin">⟳</span> Uploading...</> : editingId ? 'Update' : 'Add Scholarship'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  )
}