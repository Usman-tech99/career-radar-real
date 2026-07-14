import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import SafeImage from '../../components/ui/SafeImage'
import toast from 'react-hot-toast'
import { Save, Upload } from 'lucide-react'

export default function MyProfile() {
  const { user, role } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [data, setData] = useState({
    full_name: '',
    role_title: '',
    bio: '',
    avatar_url: '',
    linkedin_url: '',
    twitter_url: '',
    is_visible_on_team_page: true
  })

  useEffect(() => {
    if (user) fetchProfile()
  }, [user])

  async function fetchProfile() {
    const { data: profileData, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (error) {
      if (error.code !== 'PGRST116') toast.error('Failed to load profile') // ignore not found
    } else if (profileData) {
      setData(profileData)
    }
    setLoading(false)
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    
    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Math.random()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`
    const bucket = 'avatars' // Public bucket

    try {
      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath)
      setData({ ...data, avatar_url: publicUrl })
      toast.success('Avatar uploaded')
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      ...data
    })
    
    if (error) toast.error(error.message)
    else toast.success('Profile saved successfully')
    
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted text-sm mt-1">Manage how you appear on the Team & Contributors page.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save size={20} /> {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 glass-card flex flex-col items-center justify-center py-12">
            <div className="w-32 h-32 rounded-full border-4 border-white/[0.05] overflow-hidden mb-6 relative group">
              <SafeImage src={data.avatar_url} alt={data.full_name || 'avatar'} className="w-full h-full object-cover" />
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Upload size={24} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
            <h2 className="text-xl font-bold">{data.full_name || 'Anonymous'}</h2>
            <p className="text-sm text-gold mt-1 font-mono uppercase tracking-widest">{role}</p>
            {uploading && <p className="text-xs text-blue-accent mt-4">Uploading image...</p>}
          </div>

          <div className="lg:col-span-2 glass-card space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input 
                  value={data.full_name} 
                  onChange={e => setData({...data, full_name: e.target.value})} 
                  className="input-field"
                  placeholder="Muhammad Usman"
                />
              </div>
              <div>
                <label className="label">Role / Title</label>
                <input 
                  value={data.role_title} 
                  onChange={e => setData({...data, role_title: e.target.value})} 
                  className="input-field"
                  placeholder="e.g. Lead Instructor"
                />
              </div>
            </div>

            <div>
              <label className="label">Bio</label>
              <textarea 
                value={data.bio} 
                onChange={e => setData({...data, bio: e.target.value})} 
                className="input-field h-32"
                placeholder="A short description about yourself..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">LinkedIn URL</label>
                <input 
                  value={data.linkedin_url} 
                  onChange={e => setData({...data, linkedin_url: e.target.value})} 
                  className="input-field"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div>
                <label className="label">Twitter / X URL</label>
                <input 
                  value={data.twitter_url} 
                  onChange={e => setData({...data, twitter_url: e.target.value})} 
                  className="input-field"
                  placeholder="https://twitter.com/..."
                />
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-border">
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-white/[0.02] rounded-xl border border-border">
                <input 
                  type="checkbox" 
                  checked={data.is_visible_on_team_page}
                  onChange={e => setData({...data, is_visible_on_team_page: e.target.checked})} 
                  className="w-5 h-5 accent-gold rounded" 
                />
                <div>
                  <span className="font-bold block">Visible on Team Page</span>
                  <span className="text-xs text-muted">If unchecked, your profile will be hidden from the public Team section.</span>
                </div>
              </label>
            </div>
          </div>
        </div>
    </div>
  )
}
