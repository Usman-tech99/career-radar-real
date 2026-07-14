import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, X, Linkedin, Github, Youtube, Twitter, Instagram, Facebook, Globe, MessageCircle, Send, Users, ExternalLink } from 'lucide-react'

const platformIcons = {
  whatsapp: MessageCircle, youtube: Youtube, instagram: Instagram,
  telegram: Send, linkedin: Linkedin, twitter: Twitter, discord: Users,
  tiktok: ExternalLink, facebook: Facebook, other: ExternalLink,
}

const platformColors = {
  whatsapp: 'text-green-400', youtube: 'text-red-500', instagram: 'text-pink-400',
  telegram: 'text-blue-400', linkedin: 'text-blue-500', twitter: 'text-sky-400',
  discord: 'text-indigo-400', tiktok: 'text-gray-300', facebook: 'text-blue-500',
  other: 'text-muted',
}

const socialSchema = z.object({
  platform_name: z.string().min(2, "Name is required"),
  platform_type: z.enum(['whatsapp','youtube','instagram','telegram','linkedin','twitter','discord','tiktok','facebook','other']),
  handle_or_name: z.string().optional(),
  url: z.string().url("Must be a valid URL"),
  description: z.string().optional(),
  members_count: z.string().optional(),
  is_active: z.boolean().default(true),
  is_primary: z.boolean().default(false),
  sort_order: z.preprocess((val) => Number(val), z.number().default(99)),
})

export default function ManageSocials() {
  const [socials, setSocials] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(socialSchema),
    defaultValues: { is_active: true, is_primary: false, sort_order: 99 }
  })

  useEffect(() => {
    fetchSocials()
  }, [])

  async function fetchSocials() {
    const { data, error } = await supabase.from('socials').select('*').order('sort_order', { ascending: true })
    if (error) toast.error('Failed to fetch socials')
    else setSocials(data || [])
    setLoading(false)
  }

  function openModal(item = null) {
    if (item) {
      setEditingId(item.id)
      setValue('platform_name', item.platform_name)
      setValue('platform_type', item.platform_type)
      setValue('handle_or_name', item.handle_or_name || '')
      setValue('url', item.url)
      setValue('description', item.description || '')
      setValue('members_count', item.members_count || '')
      setValue('is_active', item.is_active)
      setValue('is_primary', item.is_primary)
      setValue('sort_order', item.sort_order)
    } else {
      setEditingId(null)
      reset()
    }
    setIsModalOpen(true)
  }

  async function onSubmit(data) {
    try {
      if (editingId) {
        const { error } = await supabase.from('socials').update(data).eq('id', editingId)
        if (error) throw error
        toast.success('Social link updated')
      } else {
        const { error } = await supabase.from('socials').insert([data])
        if (error) throw error
        toast.success('Social link added')
      }
      setIsModalOpen(false)
      fetchSocials()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function deleteSocial(id) {
    if (!window.confirm('Delete this link?')) return
    const { error } = await supabase.from('socials').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Deleted')
      fetchSocials()
    }
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Socials & Communities</h1>
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <Plus size={20} /> Add Link
          </button>
        </div>

        {loading ? (
          <div className="skeleton w-full h-64 rounded-2xl"></div>
        ) : socials.length === 0 ? (
          <div className="glass-card text-center py-12 text-muted">No links found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {socials.map(item => (
              <div key={item.id} className="glass-card flex flex-col relative overflow-hidden">
                {item.is_primary && (
                  <div className="absolute top-0 right-0 bg-gold text-surface text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                    PRIMARY
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center ${platformColors[item.platform_type] || 'text-muted'}`}>
                    {(() => {
                      const Icon = platformIcons[item.platform_type] || ExternalLink
                      return <Icon size={20} />
                    })()}
                  </div>
                  <div>
                    <h3 className="font-bold">{item.platform_name}</h3>
                    <p className="text-xs text-muted">{item.handle_or_name}</p>
                  </div>
                </div>
                
                {item.members_count && (
                  <div className="text-xs text-blue-accent mb-2 font-mono bg-blue-500/10 w-fit px-2 py-1 rounded">
                    {item.members_count} Members
                  </div>
                )}
                
                <p className="text-sm text-muted mb-4 flex-1 line-clamp-2">{item.description}</p>
                
                <div className="flex justify-between items-center border-t border-border mt-auto pt-4">
                  <span className={`text-xs ${item.is_active ? 'text-gold' : 'text-red-400'}`}>
                    {item.is_active ? 'Active' : 'Hidden'}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(item)} className="p-2 text-blue-accent hover:bg-blue-500/10 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteSocial(item.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
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
            <div className="glass-card w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingId ? 'Edit Link' : 'Add Link'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-white"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Platform Name</label>
                    <input {...register('platform_name')} className="input-field" placeholder="e.g. Official WhatsApp" />
                    {errors.platform_name && <p className="text-red-400 text-sm mt-1">{errors.platform_name.message}</p>}
                  </div>
                  <div>
                    <label className="label">Type</label>
                    <select {...register('platform_type')} className="input-field">
                      <option value="whatsapp">WhatsApp</option>
                      <option value="youtube">YouTube</option>
                      <option value="instagram">Instagram</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="telegram">Telegram</option>
                      <option value="discord">Discord</option>
                      <option value="facebook">Facebook</option>
                      <option value="twitter">Twitter (X)</option>
                      <option value="tiktok">TikTok</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">URL Link</label>
                    <input {...register('url')} className="input-field" placeholder="https://" />
                    {errors.url && <p className="text-red-400 text-sm mt-1">{errors.url.message}</p>}
                  </div>
                  <div>
                    <label className="label">Handle / Username (Optional)</label>
                    <input {...register('handle_or_name')} className="input-field" placeholder="@careerradar" />
                  </div>
                </div>

                <div>
                  <label className="label">Description (Optional)</label>
                  <textarea {...register('description')} className="input-field h-20" placeholder="Join our community..." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Members Count Text (Optional)</label>
                    <input {...register('members_count')} className="input-field" placeholder="e.g. 10k+" />
                  </div>
                  <div>
                    <label className="label">Sort Order</label>
                    <input type="number" {...register('sort_order')} className="input-field" />
                  </div>
                </div>

                <div className="flex gap-6 mt-4 p-4 border border-border rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('is_primary')} className="w-4 h-4 accent-gold rounded" />
                    <span className="text-sm font-bold text-gold">Primary Action</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('is_active')} className="w-4 h-4 accent-gold rounded" />
                    <span className="text-sm">Active</span>
                  </label>
                </div>

                <div className="pt-4 flex justify-end gap-4 border-t border-border mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" className="btn-primary">Save Link</button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  )
}
