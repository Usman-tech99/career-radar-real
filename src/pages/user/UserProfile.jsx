import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { LayoutDashboard, Target, Activity, User, LogOut, Upload, Save } from 'lucide-react'

export default function UserProfile() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  
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
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    
    setUploading(true)
    setAvatarError(false)
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Math.random()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`
    const bucket = 'avatars'

    const previewUrl = URL.createObjectURL(file)
    setProfile(prev => ({ ...prev, avatar_url: previewUrl }))

    try {
      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError

      const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }))
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`)
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
        console.error('Score recalc error:', scoreError.context?.status, scoreError.context?.body)
      }

      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const NavLink = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to
    return (
      <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
        isActive ? 'bg-green/10 text-green border border-green/20' : 'text-muted hover:bg-white/[0.04] hover:text-white'
      }`}>
        <Icon size={20} className={isActive ? 'text-green' : 'text-muted'} />
        {label}
      </Link>
    )
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <div className="w-64 h-screen bg-surface border-r border-border flex flex-col fixed left-0 top-0 pt-20">
        <div className="flex-1 px-4 py-6 space-y-2">
          <NavLink to="/dashboard" icon={LayoutDashboard} label="Overview" />
          <NavLink to="/dashboard/blueprint" icon={Target} label="AI Blueprint" />
          <NavLink to="/dashboard/score" icon={Activity} label="Career Score" />
          <NavLink to="/dashboard/profile" icon={User} label="Profile Settings" active={true} />
        </div>
        <div className="p-4 border-t border-border">
          <button type="button" onClick={signOut} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-colors font-medium">
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </div>

      <div className="flex-1 ml-64 p-8">
        {loading ? (
          <div className="skeleton w-full h-full min-h-[500px] rounded-2xl"></div>
        ) : (
          <div className="max-w-3xl">
            <div className="flex justify-between items-center mb-8 border-b border-border pb-6">
              <div>
                <h1 className="text-3xl font-bold font-sora mb-2">Profile Settings</h1>
                <p className="text-muted">Manage your public details.</p>
              </div>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                <Save size={20} /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>

            <div className="glass-card flex flex-col sm:flex-row gap-8 items-start mb-8">
              <div className="flex flex-col gap-3 items-start">
                <label className="label text-sm font-medium text-muted">Avatar</label>
                <div className="w-40 h-40 rounded-full border-4 border-white/[0.05] overflow-hidden relative group">
                  {profile.avatar_url && !avatarError ? (
                    <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-full" crossOrigin="anonymous" onError={() => setAvatarError(true)} />
                  ) : (
                    <div className="w-full h-full bg-white/[0.02] flex items-center justify-center text-4xl text-muted font-bold">
                      {profile.full_name ? profile.full_name[0] : <User size={40} />}
                    </div>
                  )}
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

            <div className="glass-card border border-red-500/20 bg-red-500/5">
              <h2 className="text-xl font-bold text-red-500 mb-2">Danger Zone</h2>
              <p className="text-sm text-muted mb-4">Once you delete your account, there is no going back. Please be certain.</p>
              <button 
                onClick={() => toast.error("Please contact support to delete your account.")}
                className="btn-ghost text-red-500 border border-red-500 hover:bg-red-500 hover:text-white"
              >
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
