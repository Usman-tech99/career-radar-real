import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import AdminSidebar from '../../components/layout/AdminSidebar'
import toast from 'react-hot-toast'
import { Plus, Trash2, ShieldAlert } from 'lucide-react'

export default function ManageTeam() {
  const { user } = useAuth()
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)

  const [isCreating, setIsCreating] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newRole, setNewRole] = useState('admin')

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
          role: newRole
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(`${newRole} created successfully!`)
      setNewEmail('')
      setNewPassword('')
      setNewFullName('')
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
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShieldAlert className="text-red-500" /> Manage Team
            </h1>
            <p className="text-muted text-sm mt-1">Super Admin only. Create and manage admins and collaborators.</p>
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
                  <input required type="text" minLength="6" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field" placeholder="password123" />
                </div>
                <div>
                  <label className="label">Role Level</label>
                  <select value={newRole} onChange={e => setNewRole(e.target.value)} className="input-field">
                    <option value="admin">Admin (Full Access to Content)</option>
                    <option value="collaborator">Collaborator (Profile Only)</option>
                    <option value="super_admin">Super Admin (Founder)</option>
                  </select>
                </div>
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
                            {member.role}
                          </span>
                        </div>
                        <p className="text-sm text-muted mt-1">ID: {member.user_id}</p>
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
    </div>
  )
}
