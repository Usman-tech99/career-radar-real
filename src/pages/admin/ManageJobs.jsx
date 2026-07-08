import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import { formatDate } from '../../lib/helpers'

const jobSchema = z.object({
  title: z.string().min(3, "Title is required"),
  company: z.string().min(2, "Company is required"),
  location: z.string().optional(),
  type: z.enum(['Full-time', 'Part-time', 'Internship', 'Freelance', 'Remote']),
  description: z.string().optional(),
  apply_url: z.string().url("Must be a valid URL").or(z.literal('')).optional(),
  contact: z.string().optional(),
  deadline: z.string().optional(),
  tags: z.string().optional(),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  has_link: z.enum(['yes', 'no']).default('yes'),
})

export default function ManageJobs() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(jobSchema)
  })
  const hasLink = watch('has_link', 'yes')

  useEffect(() => {
    fetchJobs()
  }, [])

  async function fetchJobs() {
    const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false })
    if (error) toast.error('Failed to fetch jobs')
    else setJobs(data || [])
    setLoading(false)
  }

  function openModal(job = null) {
    if (job) {
      setEditingId(job.id)
      setValue('title', job.title)
      setValue('company', job.company)
      setValue('location', job.location || '')
      setValue('type', job.type)
      setValue('description', job.description || '')
      setValue('apply_url', job.apply_url || '')
      setValue('contact', job.contact || '')
      setValue('deadline', job.deadline || '')
      setValue('tags', job.tags ? job.tags.join(', ') : '')
      setValue('is_featured', job.is_featured)
      setValue('is_active', job.is_active)
      setValue('has_link', job.apply_url ? 'yes' : 'no')
    } else {
      setEditingId(null)
      reset({ has_link: 'yes' })
    }
    setIsModalOpen(true)
  }

  async function onSubmit(data) {
    // Strip has_link from payload — not a DB column, only used for UI toggle
    const { has_link, ...rest } = data
    const payload = {
      ...rest,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
      posted_by: user.id
    }

    try {
      if (editingId) {
        const { error } = await supabase.from('jobs').update(payload).eq('id', editingId)
        if (error) throw error
        toast.success('Job updated successfully')
      } else {
        const { error } = await supabase.from('jobs').insert([payload])
        if (error) throw error
        toast.success('Job created successfully')
        // Also update site_stats
        await supabase.rpc('increment_jobs_posted') // Note: Need to handle this or just manual increment
      }
      setIsModalOpen(false)
      fetchJobs()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function deleteJob(id) {
    if (!window.confirm('Are you sure you want to delete this job?')) return
    const { error } = await supabase.from('jobs').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Job deleted')
      fetchJobs()
    }
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Jobs</h1>
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <Plus size={20} /> Add Job
          </button>
        </div>

        {loading ? (
          <div className="skeleton w-full h-64 rounded-2xl"></div>
        ) : jobs.length === 0 ? (
          <div className="glass-card text-center py-12 text-muted">No jobs found. Add one!</div>
        ) : (
          <div className="glass-card overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-[#94A3B8] font-medium">Title</th>
                  <th className="p-4 text-[#94A3B8] font-medium">Company</th>
                  <th className="p-4 text-[#94A3B8] font-medium">Type</th>
                  <th className="p-4 text-[#94A3B8] font-medium">Status</th>
                  <th className="p-4 text-[#94A3B8] font-medium">Posted</th>
                  <th className="p-4 text-right text-[#94A3B8] font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                    <td className="p-4 font-medium">{job.title}</td>
                    <td className="p-4">{job.company}</td>
                    <td className="p-4"><span className="badge-blue">{job.type}</span></td>
                    <td className="p-4">
                      {job.is_active ? <span className="text-green text-sm">Active</span> : <span className="text-red-400 text-sm">Inactive</span>}
                    </td>
                    <td className="p-4 text-sm text-muted">{formatDate(job.created_at)}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => openModal(job)} className="text-blue-accent hover:text-blue-400 p-2"><Edit2 size={18} /></button>
                      <button onClick={() => deleteJob(job.id)} className="text-red-500 hover:text-red-400 p-2 ml-2"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingId ? 'Edit Job' : 'Add New Job'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-white"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Job Title</label>
                    <input {...register('title')} className="input-field" placeholder="e.g. Frontend Developer" />
                    {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
                  </div>
                  <div>
                    <label className="label">Company</label>
                    <input {...register('company')} className="input-field" placeholder="e.g. Google" />
                    {errors.company && <p className="text-red-400 text-sm mt-1">{errors.company.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Type</label>
                    <select {...register('type')} className="input-field">
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Internship">Internship</option>
                      <option value="Freelance">Freelance</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Location</label>
                    <input {...register('location')} className="input-field" placeholder="e.g. Lahore, PK" />
                  </div>
                </div>

                <div>
                  <label className="label">Job Details Source</label>
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value="yes" {...register('has_link')} className="w-4 h-4 accent-green" />
                      <span className="text-sm">External Link</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value="no" {...register('has_link')} className="w-4 h-4 accent-green" />
                      <span className="text-sm">Description Only</span>
                    </label>
                  </div>
                </div>

                {hasLink === 'yes' ? (
                  <div>
                    <label className="label">Apply URL</label>
                    <input {...register('apply_url')} className="input-field" placeholder="https://" />
                    {errors.apply_url && <p className="text-red-400 text-sm mt-1">{errors.apply_url.message}</p>}
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="label">Full Description</label>
                      <textarea {...register('description')} className="input-field h-48" placeholder="Provide complete job details, requirements, and how to apply..." />
                    </div>
                    <div>
                      <label className="label">Contact Info <span className="text-muted font-normal">(email, phone, or apply instructions)</span></label>
                      <input {...register('contact')} className="input-field" placeholder="e.g. hr@company.com or +92 300 1234567" />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Deadline (Optional)</label>
                    <input type="date" {...register('deadline')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Tags (comma separated)</label>
                    <input {...register('tags')} className="input-field" placeholder="React, Node, UI/UX" />
                  </div>
                </div>

                <div className="flex gap-6 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('is_featured')} className="w-4 h-4 accent-green rounded" />
                    <span className="text-sm">Featured Job (Gold Border)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('is_active')} className="w-4 h-4 accent-green rounded" />
                    <span className="text-sm">Active (Visible)</span>
                  </label>
                </div>

                <div className="pt-4 flex justify-end gap-4 border-t border-border mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" className="btn-primary">Save Job</button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  )
}
