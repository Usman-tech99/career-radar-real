import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import SafeImage from '../../components/ui/SafeImage'
import { Plus, Edit2, Trash2, X, Users, Upload, Image as ImageIcon, Loader2, Linkedin, Github, Youtube, Twitter, Instagram, Facebook, Globe, MessageCircle, Send, ExternalLink } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const platforms = ['linkedin', 'github', 'youtube', 'twitter', 'instagram', 'facebook', 'discord', 'website', 'other']

const platformIcons = {
  linkedin: Linkedin, github: Github, youtube: Youtube, twitter: Twitter,
  instagram: Instagram, facebook: Facebook, discord: MessageCircle,
  website: Globe, other: ExternalLink,
}

const platformColors = {
  linkedin: 'text-blue-500', github: 'text-gray-300', youtube: 'text-red-500',
  twitter: 'text-sky-400', instagram: 'text-pink-400', facebook: 'text-blue-500',
  discord: 'text-indigo-400', website: 'text-gold', other: 'text-muted',
}

const teamMemberSchema = z.object({
  name: z.string().min(2, "Name is required"),
  role: z.string().min(2, "Role is required"),
  skills: z.string().optional(),
  age: z.preprocess((val) => (val === '' || val === undefined || val === null) ? undefined : Number(val), z.number().int().min(1).max(120).optional()),
  education: z.string().optional(),
  goal: z.string().optional(),
  sort_order: z.preprocess((val) => Number(val), z.number().default(99)),
  is_active: z.boolean().default(true),
})

const STORAGE_BUCKET = 'team-avatars'

export default function ManageTeamMembers() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [socialLinks, setSocialLinks] = useState([{ platform: '', url: '' }])

  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState(null)
  const [uploading, setUploading] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: { is_active: true, sort_order: 99 }
  })

  useEffect(() => {
    fetchMembers()
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function fetchMembers() {
    const { data, error } = await supabase.from('team_members').select('*').order('sort_order', { ascending: true })
    if (error) toast.error('Failed to fetch team members')
    else setMembers(data || [])
    setLoading(false)
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }

    setSelectedFile(file)
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function clearFileSelection() {
    setSelectedFile(null)
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(existingImageUrl || null)
    document.getElementById('team-avatar-input')?.value && (document.getElementById('team-avatar-input').value = '')
  }

  function openModal(member = null) {
    if (member) {
      setEditingId(member.id)
      setValue('name', member.name)
      setValue('role', member.role)
      setValue('skills', member.skills ? member.skills.join(', ') : '')
      setValue('age', member.age || '')
      setValue('education', member.education || '')
      setValue('goal', member.goal || '')
      setValue('sort_order', member.sort_order)
      setValue('is_active', member.is_active)

      setExistingImageUrl(member.image_url || null)
      setPreviewUrl(member.image_url || null)
      setSelectedFile(null)

      const links = member.social_links && typeof member.social_links === 'object'
        ? Object.entries(member.social_links).map(([platform, url]) => ({ platform, url: url || '' }))
        : [{ platform: '', url: '' }]
      setSocialLinks(links.length ? links : [{ platform: '', url: '' }])
    } else {
      setEditingId(null)
      reset()
      setExistingImageUrl(null)
      setPreviewUrl(null)
      setSelectedFile(null)
      setSocialLinks([{ platform: '', url: '' }])
    }
    setIsModalOpen(true)
  }

  async function uploadImage(file) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const filename = `avatar-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filename, file, { contentType: file.type })

    if (uploadError) throw new Error(uploadError.message || 'Failed to upload image')

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filename)

    return urlData?.publicUrl || null
  }

  async function onSubmit(data) {
    const skills = data.skills
      ? data.skills.split(',').map(s => s.trim()).filter(Boolean)
      : []
    const socialsObj = {}
    socialLinks.forEach(({ platform, url }) => {
      if (platform && url) socialsObj[platform] = url
    })

    let imageUrl = existingImageUrl

    if (selectedFile) {
      setUploading(true)
      try {
        imageUrl = await uploadImage(selectedFile)
      } catch (err) {
        toast.error(err.message)
        setUploading(false)
        return
      } finally {
        setUploading(false)
      }
    }

    const payload = {
      name: data.name,
      role: data.role,
      image_url: imageUrl || null,
      skills,
      age: data.age || null,
      education: data.education || null,
      goal: data.goal || null,
      social_links: socialsObj,
      sort_order: data.sort_order,
      is_active: data.is_active,
    }

    try {
      if (editingId) {
        const { error } = await supabase.from('team_members').update(payload).eq('id', editingId)
        if (error) throw error
        toast.success('Team member updated')
      } else {
        const { error } = await supabase.from('team_members').insert([payload])
        if (error) throw error
        toast.success('Team member added')
      }
      setIsModalOpen(false)
      fetchMembers()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function deleteMember(id) {
    if (!window.confirm('Delete this team member?')) return
    const { error } = await supabase.from('team_members').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Deleted')
      fetchMembers()
    }
  }

  function addSocialRow() {
    setSocialLinks([...socialLinks, { platform: '', url: '' }])
  }

  function removeSocialRow(index) {
    setSocialLinks(socialLinks.filter((_, i) => i !== index))
  }

  function updateSocial(index, field, value) {
    const updated = [...socialLinks]
    updated[index][field] = value
    setSocialLinks(updated)
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="text-gold" /> Manage Team Members
          </h1>
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <Plus size={20} /> Add Member
          </button>
        </div>

        {loading ? (
          <div className="skeleton w-full h-64 rounded-2xl" />
        ) : members.length === 0 ? (
          <div className="glass-card text-center py-12 text-muted">No team members yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map(member => (
              <div key={member.id} className="glass-card flex flex-col relative overflow-hidden">
                <div className="flex items-center gap-4 mb-4">
                  <SafeImage src={member.image_url} alt={member.name} className="w-16 h-16 rounded-full object-cover border-2 border-white/[0.05]" />
                  <div>
                    <h3 className="font-bold">{member.name}</h3>
                    <p className="text-sm text-gold">{member.role}</p>
                  </div>
                </div>
                {member.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {member.skills.slice(0, 3).map((skill, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-muted">{skill}</span>
                    ))}
                    {member.skills.length > 3 && (
                      <span className="text-[10px] text-muted">+{member.skills.length - 3}</span>
                    )}
                  </div>
                )}
                {member.social_links && typeof member.social_links === 'object' && Object.keys(member.social_links).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.entries(member.social_links).map(([platform, url]) => {
                      const Icon = platformIcons[platform] || ExternalLink
                      return (
                        <a key={platform} href={url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} title={platform} className={`${platformColors[platform] || 'text-muted'} hover:opacity-80 transition-opacity`}>
                          <Icon size={16} />
                        </a>
                      )
                    })}
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-border mt-auto pt-4">
                  <span className={`text-xs ${member.is_active ? 'text-gold' : 'text-red-400'}`}>
                    {member.is_active ? 'Active' : 'Hidden'}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(member)} className="p-2 text-blue-accent hover:bg-blue-500/10 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteMember(member.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
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
                <h2 className="text-2xl font-bold">{editingId ? 'Edit Team Member' : 'Add Team Member'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-white"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Full Name</label>
                    <input {...register('name')} className="input-field" placeholder="Muhammad Usman" />
                    {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="label">Role / Title</label>
                    <input {...register('role')} className="input-field" placeholder="e.g. Founder, Developer" />
                    {errors.role && <p className="text-red-400 text-sm mt-1">{errors.role.message}</p>}
                  </div>
                </div>

                {/* Avatar Upload */}
                <div>
                  <label className="label">Avatar Image</label>
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      {previewUrl ? (
                        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/[0.05]">
                          <SafeImage src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-white/[0.05] flex items-center justify-center border-2 border-dashed border-white/[0.1]">
                          <ImageIcon size={24} className="text-muted" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] transition-colors text-sm font-medium">
                        <Upload size={16} />
                        {selectedFile ? 'Change Image' : 'Choose File'}
                        <input
                          id="team-avatar-input"
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                      {selectedFile && (
                        <button type="button" onClick={clearFileSelection} className="ml-2 text-xs text-red-400 hover:underline">
                          Remove
                        </button>
                      )}
                      <p className="text-[10px] text-muted mt-1">PNG, JPG, WEBP. Max 5MB.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Age</label>
                    <input type="number" {...register('age')} className="input-field" placeholder="25" />
                  </div>
                  <div>
                    <label className="label">Sort Order</label>
                    <input type="number" {...register('sort_order')} className="input-field" />
                  </div>
                </div>

                <div>
                  <label className="label">Skills (comma separated)</label>
                  <input {...register('skills')} className="input-field" placeholder="React, Node.js, UI/UX" />
                </div>

                <div>
                  <label className="label">Education</label>
                  <input {...register('education')} className="input-field" placeholder="BS Computer Science, MIT" />
                </div>

                <div>
                  <label className="label">Goal</label>
                  <textarea {...register('goal')} className="input-field h-20" placeholder="What drives this team member..." />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label mb-0">Social Links</label>
                    <button type="button" onClick={addSocialRow} className="text-xs text-gold hover:underline">+ Add platform</button>
                  </div>
                  {socialLinks.map((link, i) => (
                    <div key={i} className="flex flex-col sm:flex-row gap-2 mb-2">
                      <select
                        value={link.platform}
                        onChange={e => updateSocial(i, 'platform', e.target.value)}
                        className="input-field sm:w-2/5"
                      >
                        <option value="">Select...</option>
                        {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <input
                        value={link.url}
                        onChange={e => updateSocial(i, 'url', e.target.value)}
                        className="input-field flex-1"
                        placeholder="https://"
                      />
                      {socialLinks.length > 1 && (
                        <button type="button" onClick={() => removeSocialRow(i)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-6 mt-4 p-4 border border-border rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('is_active')} className="w-4 h-4 accent-gold rounded" />
                    <span className="text-sm">Active on team page</span>
                  </label>
                </div>

                <div className="pt-4 flex justify-end gap-4 border-t border-border mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" className="btn-primary flex items-center gap-2" disabled={uploading}>
                    {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading image...</> : 'Save Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  )
}