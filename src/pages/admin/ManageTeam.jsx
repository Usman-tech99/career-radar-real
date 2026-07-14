import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Plus, Trash2, ShieldAlert, Check } from 'lucide-react'

const ALL_PERMISSIONS = [
  { key: 'manage_jobs', label: 'Manage Jobs' },
  { key: 'manage_content', label: 'Manage Content' },
  { key: 'manage_products', label: 'Manage Products' },
  { key: 'manage_education', label: 'Manage Education' },
  { key: 'manage_scholarships', label: 'Manage Scholarships' },
  { key: 'manage_about', label: 'Manage About' },
  { key: 'manage_community', label: 'Manage Community' },
  { key: 'manage_socials', label: 'Manage Socials' },
  { key: 'manage_collaborators', label: 'Manage Collaborators' },
]

export default function ManageTeam() {
  const { user } = useAuth()
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)

  const [isCreating, setIsCreating] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newRole, setNewRole] = useState('admin')
  const [newRoleLabel, setNewRoleLabel] = useState('')
  const [newPermissions, setNewPermissions] = useState([])

  useEffect(() => {
    fetchTeam()
  }, [])

  async function fetchTeam() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')

      if (error) {
        console.error("Team Fetch Error:", error.message)
        setTeam([])
        setLoading(false)
        return
      }

      const rows = data || []

      const userIds = rows.map(r => r.user_id).filter(Boolean)

      let profileMap = {}
      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)

        if (profileError) {
          console.error("Team Fetch: profiles query error:", profileError.message)
        } else if (profiles) {
          profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))
        }
      }

      const enriched = rows.map(member => ({
        ...member,
        profiles: profileMap[member.user_id] || null
      }))

      setTeam(enriched)
    } catch (err) {
      console.error("Team Fetch Error:", err.message)
      setTeam([])
    } finally {
      setLoading(false)
    }
  }

  function togglePermission(key) {
    setNewPermissions(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    )
  }

  async function handleCreateUser(e) {
    e.preventDefault()
    setIsCreating(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          fullName: newFullName,
          role: newRole,
          role_label: newRoleLabel,
          permissions: newPermissions
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(`${newRoleLabel || newRole} created successfully!`)
      setNewEmail('')
      setNewPassword('')
      setNewFullName('')
      setNewRoleLabel('')
      setNewPermissions([])
      fetchTeam()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDeleteUser(targetUserId) {
    if (targetUserId === user.id) {
      toast.error('You cannot delete yourself')
      return
    }

    if (!window.confirm('Are you absolutely sure you want to permanently delete this user and all their data?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-admin-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ targetUserId })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success('User deleted')
      fetchTeam()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShieldAlert className="text-red-500" /> Manage Admins
            </h1>
            <p className="text-muted text-sm mt-1">Super Admin only. Create and manage admin and collaborator accounts.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="glass-card">
              <h2 className="text-xl font-bold mb-6">Create New Member</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <input required value={newFullName} onChange={e => setNewFullName(e.target.value)} className="input-field" placeholder="Alice" />
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="input-field" placeholder="alice@example.com" />
                </div>
                <div>
                  <label className="label">Temporary Password</label>
                  <input required type="text" minLength="6" maxLength={16} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field" placeholder="password123" />
                </div>
                <div>
                  <label className="label">Role Level</label>
                  <select value={newRole} onChange={e => {
                    setNewRole(e.target.value)
                    if (e.target.value === 'collaborator' || e.target.value === 'super_admin') {
                      setNewPermissions([])
                      setNewRoleLabel('')
                    }
                  }} className="input-field">
                    <option value="admin">Admin (Custom Permissions)</option>
                    <option value="collaborator">Collaborator (Profile Only)</option>
                    <option value="super_admin">Super Admin (Full Access)</option>
                  </select>
                </div>

                {newRole === 'admin' && (
                  <>
                    <div>
                      <label className="label">Role Label (e.g. "Product Manager")</label>
                      <input value={newRoleLabel} onChange={e => setNewRoleLabel(e.target.value)} className="input-field" placeholder="Product Manager" />
                    </div>
                    <div>
                      <label className="label">Permissions</label>
                      <div className="space-y-2 mt-2">
                        {ALL_PERMISSIONS.map(p => (
                          <label key={p.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] cursor-pointer">
                            <div
                              onClick={() => togglePermission(p.key)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                newPermissions.includes(p.key)
                                  ? 'bg-gold border-gold'
                                  : 'border-border hover:border-gold'
                              }`}
                            >
                              {newPermissions.includes(p.key) && <Check size={14} className="text-white" />}
                            </div>
                            <span className="text-sm">{p.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                <button type="submit" disabled={isCreating} className="btn-primary w-full mt-4 flex justify-center gap-2">
                  <Plus size={20} /> {isCreating ? 'Creating...' : 'Create Account'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="glass-card">
              <h2 className="text-xl font-bold mb-6">Current Team Members</h2>
              {loading ? (
                <div className="skeleton w-full h-32 rounded-xl"></div>
              ) : team.length === 0 ? (
                <p className="text-muted text-sm py-8 text-center">No team members found. Create the first one.</p>
              ) : (
                <div className="space-y-4">
                  {team.map(member => (
                    <div key={member.user_id} className="flex justify-between items-center p-4 border border-border rounded-xl bg-white/[0.02]">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold">{member.profiles?.full_name || 'No Name'}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            member.role === 'super_admin' ? 'bg-red-500/20 text-red-500' :
                            member.role === 'admin' ? 'bg-blue-500/20 text-blue-500' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {member.role_label || member.role}
                          </span>
                        </div>
                        <p className="text-sm text-muted mt-1">
                          {member.role === 'admin' && member.permissions?.length > 0
                            ? member.permissions.map(p => p.replace('manage_', '').replace(/_/g, ' ')).join(', ')
                            : member.role === 'super_admin' ? 'Full access'
                            : 'Profile only'}
                        </p>
                      </div>

                      {member.user_id !== user.id && (
                        <button
                          onClick={() => handleDeleteUser(member.user_id)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg flex items-center gap-2"
                        >
                          <Trash2 size={18} /> <span className="text-sm">Delete</span>
                        </button>
                      )}
                      {member.user_id === user.id && (
                        <span className="text-sm text-muted italic">You</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  )
}
