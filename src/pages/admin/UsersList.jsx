import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, Search, ChevronDown, ChevronUp, GraduationCap, Target, Sparkles, Globe, Briefcase, BookOpen } from 'lucide-react'

export default function UsersList() {
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, bio, role_title, created_at')
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) {
        console.error("Users Fetch Error:", error.message)
        setAllUsers([])
        setLoading(false)
        return
      }

      const userIds = (profiles || []).map(p => p.id).filter(Boolean)

      let roleMap = {}
      let onboardingMap = {}
      let publicUserMap = {}

      if (userIds.length > 0) {
        const [rolesRes, onboardingRes, publicRes] = await Promise.all([
          supabase.from('user_roles').select('user_id, role, role_label').in('user_id', userIds),
          supabase.from('onboarding_data').select('*').in('user_id', userIds),
          supabase.from('public_users').select('*').in('id', userIds)
        ])

        if (rolesRes.data) {
          roleMap = Object.fromEntries(rolesRes.data.map(r => [r.user_id, r]))
        }
        if (onboardingRes.data) {
          onboardingMap = Object.fromEntries(onboardingRes.data.map(o => [o.user_id, o]))
        }
        if (publicRes.data) {
          publicUserMap = Object.fromEntries(publicRes.data.map(p => [p.id, p]))
        }
      }

      setAllUsers((profiles || []).map(p => ({
        ...p,
        roleData: roleMap[p.id] || null,
        onboarding: onboardingMap[p.id] || null,
        publicUser: publicUserMap[p.id] || null
      })))
    } catch (err) {
      console.error("Users Fetch Error:", err.message)
      setAllUsers([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = allUsers.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.id?.toLowerCase().includes(search.toLowerCase()) ||
    u.onboarding?.career_goal?.toLowerCase().includes(search.toLowerCase()) ||
    u.onboarding?.degree?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="text-blue-500" /> All Registered Users
            </h1>
            <p className="text-muted text-sm mt-1">Super Admin only. View all users with onboarding details.</p>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 py-2 text-sm w-full max-w-xs"
              placeholder="Search by name, ID, degree, goal..."
            />
          </div>
        </div>

        <div className="glass-card">
          {loading ? (
            <div className="skeleton w-full h-40 rounded-xl"></div>
          ) : filtered.length === 0 ? (
            <p className="text-muted text-sm py-12 text-center">No users found.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map(u => (
                <div key={u.id}>
                  <div
                    onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
                    className="flex items-center justify-between p-4 border border-border rounded-xl bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-gold">
                          {(u.full_name || '?')[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{u.full_name || 'No Name'}</p>
                          {u.onboarding && (
                            <span className="text-[10px] bg-gold/20 text-gold px-1.5 py-0.5 rounded">onboarded</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <span className="font-mono truncate max-w-[160px]">{u.id}</span>
                          {u.onboarding?.degree && <span>Â· {u.onboarding.degree}</span>}
                          {u.onboarding?.career_goal && <span>Â· {u.onboarding.career_goal}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {u.roleData ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          u.roleData.role === 'super_admin' ? 'bg-red-500/20 text-red-500' :
                          u.roleData.role === 'admin' ? 'bg-blue-500/20 text-blue-500' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {u.roleData.role_label || u.roleData.role}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">user</span>
                      )}
                      <span className="text-xs text-muted">{new Date(u.created_at).toLocaleDateString()}</span>
                      {expandedId === u.id ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                    </div>
                  </div>

                  {expandedId === u.id && (
                    <div className="mx-4 mb-2 p-4 border border-border/50 rounded-xl bg-white/[0.01] space-y-4">
                      {u.onboarding ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
                              <GraduationCap size={14} /> Education
                            </h4>
                            <div className="space-y-2 text-sm">
                              {u.onboarding.degree && (
                                <div><span className="text-muted">Degree:</span> <span className="text-white">{u.onboarding.degree}</span></div>
                              )}
                              {u.onboarding.study_year && (
                                <div><span className="text-muted">Year:</span> <span className="text-white">{u.onboarding.study_year}</span></div>
                              )}
                              {u.onboarding.experience && (
                                <div><span className="text-muted">Experience:</span> <span className="text-white">{u.onboarding.experience}</span></div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
                              <Target size={14} /> Goals & Interests
                            </h4>
                            <div className="space-y-2 text-sm">
                              {u.onboarding.career_goal && (
                                <div><span className="text-muted">Goal:</span> <span className="text-white">{u.onboarding.career_goal}</span></div>
                              )}
                              {u.onboarding.interests?.length > 0 && (
                                <div className="flex items-start gap-2">
                                  <span className="text-muted shrink-0">Interests:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {u.onboarding.interests.map((i, idx) => (
                                      <span key={idx} className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded">{i}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
                              <Sparkles size={14} /> Skills
                            </h4>
                            {u.onboarding.skills?.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {u.onboarding.skills.map((s, idx) => (
                                  <span key={idx} className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">{s}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-muted">No skills listed</span>
                            )}
                          </div>
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
                              <Globe size={14} /> Location
                            </h4>
                            <div className="space-y-2 text-sm">
                              {u.onboarding.country && (
                                <div><span className="text-muted">Country:</span> <span className="text-white">{u.onboarding.country}</span></div>
                              )}
                              {u.onboarding.city && (
                                <div><span className="text-muted">City:</span> <span className="text-white">{u.onboarding.city}</span></div>
                              )}
                              {!u.onboarding.country && !u.onboarding.city && (
                                <span className="text-muted text-sm">Not provided</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4">
                          <p className="text-muted text-sm text-center mb-3">No onboarding data &mdash; user hasn't completed onboarding yet.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {u.publicUser && (
                              <div className="space-y-3">
                                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
                                  <Globe size={14} /> Public Profile
                                </h4>
                                <div className="space-y-2 text-sm">
                                  {u.publicUser.email && (
                                    <div><span className="text-muted">Email:</span> <span className="text-white">{u.publicUser.email}</span></div>
                                  )}
                                  {u.publicUser.country && (
                                    <div><span className="text-muted">Country:</span> <span className="text-white">{u.publicUser.country}</span></div>
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
                                <Sparkles size={14} /> Profile
                              </h4>
                              <div className="space-y-2 text-sm">
                                {u.role_title && (
                                  <div><span className="text-muted">Role Title:</span> <span className="text-white">{u.role_title}</span></div>
                                )}
                                {!u.role_title && !u.publicUser?.email && !u.publicUser?.country && (
                                  <span className="text-muted">No additional info</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {u.bio && (
                        <div className="pt-2 border-t border-border/50">
                          <span className="text-muted text-xs">Bio:</span>
                          <p className="text-sm mt-1">{u.bio}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted mt-4 text-center">
            Showing {allUsers.length} users &mdash; click to expand details
          </p>
        </div>
    </div>
  )
}
