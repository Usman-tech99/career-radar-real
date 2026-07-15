import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import SafeImage from '../../components/ui/SafeImage'
import { Upload, Save, AlertTriangle } from 'lucide-react'

export default function UserProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  
  const [profile, setProfile] = useState({
    full_name: '',
    country: '',
    avatar_url: '',
    bio: '',
    linkedin_url: ''
  })
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (user) fetchProfile()
  }, [user])

  async function fetchProfile() {
    try {
      const [pubResult, profResult] = await Promise.all([
        supabase.from('public_users').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('profiles').select('bio, linkedin_url').eq('id', user.id).maybeSingle()
      ])

      if (pubResult.data) {
        setProfile({
          full_name: pubResult.data.full_name || '',
          country: pubResult.data.country || '',
          avatar_url: pubResult.data.avatar_url || '',
          bio: profResult.data?.bio || '',
          linkedin_url: profResult.data?.linkedin_url || ''
        })
        setEmail(pubResult.data.email)
      }
    } catch (err) {
      toast.error('Failed to load profile')
      console.error('UserProfile: load error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    
    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Math.random()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`
    const bucket = 'avatars'

    const previewUrl = URL.createObjectURL(file)
    setProfile(prev => ({ ...prev, avatar_url: previewUrl }))

    try {
      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath)
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }))

      await Promise.all([
        supabase.from('public_users').update({ avatar_url: publicUrl }).eq('id', user.id),
        supabase.from('profiles').upsert({ id: user.id, avatar_url: publicUrl }, { onConflict: 'id' })
      ])
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`)
      setProfile(prev => ({ ...prev, avatar_url: '' }))
    } finally {
      setUploading(false)
      URL.revokeObjectURL(previewUrl)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { error: pubError } = await supabase.from('public_users').update({
        full_name: profile.full_name,
        country: profile.country,
        avatar_url: profile.avatar_url
      }).eq('id', user.id)
      if (pubError) throw pubError

      const { error: profError } = await supabase.from('profiles').upsert({
        id: user.id,
        bio: profile.bio || null,
        linkedin_url: profile.linkedin_url || null,
        avatar_url: profile.avatar_url
      }, { onConflict: 'id' })
      if (profError) throw profError

      const { error: scoreError } = await supabase.functions.invoke('recalculate-score', { body: {} })
      if (scoreError) {
        console.error('Score recalc error:', scoreError.message)
        throw new Error(scoreError.message || 'Score recalculation failed')
      }

      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      const { error: pubError } = await supabase.from('public_users').delete().eq('id', user.id)
      if (pubError) throw pubError

      const { error: profError } = await supabase.from('profiles').delete().eq('id', user.id)
      if (profError) throw profError

      await supabase.auth.signOut()
      toast.success('Account deleted successfully.')
      navigate('/')
    } catch (err) {
      toast.error(err.message)
      setDeleting(false)
    }
  }

  return (
    <div className="p-8">
        {loading ? (
          <div className="skeleton w-full h-full min-h-[500px] rounded-2xl"></div>
        ) : (
          <div className="max-w-3xl">
            <div className="flex justify-between items-center mb-8 border-b border-border pb-6">
              <div>
                <h1 className="text-3xl font-bold font-sora mb-2">Profile Settings</h1>
                <p className="text-muted">Manage your public details.</p>
              </div>
              <button onClick={handleSave} disabled={saving || uploading} className="btn-primary flex items-center gap-2">
                <Save size={20} /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>

            <div className="glass-card flex flex-col sm:flex-row gap-8 items-start mb-8">
              <div className="flex flex-col gap-3 items-start">
                <label className="label text-sm font-medium text-muted">Avatar</label>
                <div className="w-40 h-40 rounded-full border-4 border-white/[0.05] overflow-hidden relative group">
                  <SafeImage src={profile.avatar_url} alt={profile.full_name || 'avatar'} className="w-full h-full object-cover rounded-full" />
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Upload size={24} className="text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                  </label>
                </div>
                {uploading && <p className="text-xs text-blue-accent">Uploading...</p>}
                <p className="text-xs text-muted">Click to upload new avatar</p>
              </div>

              <div className="flex-1 space-y-5 w-full">
                <div>
                  <label className="label">Full Name</label>
                  <input 
                    value={profile.full_name} 
                    onChange={e => setProfile({...profile, full_name: e.target.value})} 
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input 
                    value={email} 
                    disabled 
                    className="input-field opacity-50 cursor-not-allowed"
                    title="Email cannot be changed here"
                  />
                </div>
                <div>
                  <label className="label">Country</label>
                  <input 
                    value={profile.country} 
                    onChange={e => setProfile({...profile, country: e.target.value})} 
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">LinkedIn URL</label>
                  <input 
                    value={profile.linkedin_url} 
                    onChange={e => setProfile({...profile, linkedin_url: e.target.value})} 
                    className="input-field"
                    placeholder="https://linkedin.com/in/your-profile"
                  />
                </div>
                <div>
                  <label className="label">Bio</label>
                  <textarea 
                    value={profile.bio} 
                    onChange={e => setProfile({...profile, bio: e.target.value})} 
                    className="input-field min-h-[80px] resize-y"
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6 mt-8">
              <h2 className="text-lg font-semibold text-white mb-1">Delete Account</h2>
              <p className="text-sm text-muted mb-4">Once deleted, your account and all associated data cannot be recovered.</p>
              {!showDelete ? (
                <button
                  onClick={() => setShowDelete(true)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
                >
                  Delete Account
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-red-400 flex items-center gap-2">
                    <AlertTriangle size={16} /> Type <strong>delete</strong> below to confirm permanent deletion.
                  </p>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                    placeholder='Type "delete" to confirm'
                    className="w-full bg-white/5 border border-red-500/30 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-muted/50 focus:outline-none focus:border-red-500/60 transition-colors"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirm !== 'delete' || deleting}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {deleting ? 'Deleting...' : 'Permanently Delete'}
                    </button>
                    <button
                      onClick={() => { setShowDelete(false); setDeleteConfirm('') }}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-muted border border-border hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  )
}
