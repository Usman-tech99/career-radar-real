import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, RefreshCw, ExternalLink, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ManageVolunteers() {
  const [volunteers, setVolunteers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetchVolunteers() }, [])

  async function fetchVolunteers() {
    setLoading(true)
    const { data, error } = await supabase.from('volunteers').select('*').order('created_at', { ascending: false })
    if (error) toast.error('Failed to load volunteers')
    else setVolunteers(data || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    const { error } = await supabase.from('volunteers').update({ status }).eq('id', id)
    if (error) toast.error('Failed to update status')
    else {
      toast.success(`Marked as ${status}`)
      setVolunteers(prev => prev.map(v => v.id === id ? { ...v, status } : v))
      if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Volunteer Applications</h1>
          <p className="text-muted text-sm mt-1">Review volunteer submissions.</p>
        </div>
        <button onClick={fetchVolunteers} className="btn-ghost border border-border flex items-center gap-2 px-4 py-2 text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : volunteers.length === 0 ? (
        <div className="glass-card text-center py-20 text-muted">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p>No volunteer applications yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3 max-h-[80vh] overflow-y-auto pr-2">
            {volunteers.map(v => (
              <div key={v.id} onClick={() => setSelected(v)} className={`glass-card p-4 cursor-pointer border transition-colors ${selected?.id === v.id ? 'border-green/40' : 'hover:border-white/20'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-white text-sm">{v.full_name}</p>
                    <p className="text-xs text-muted">{v.email}</p>
                    <p className="text-xs text-muted/60 mt-1">{v.departments?.slice(0, 2).join(', ')}{v.departments?.length > 2 ? '...' : ''}</p>
                  </div>
                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${v.status === 'approved' ? 'bg-green/10 text-green' : v.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>{v.status}</span>
                </div>
                <p className="text-[10px] text-muted/60 mt-2">{new Date(v.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selected ? (
              <div className="glass-card p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selected.full_name}</h2>
                    <p className="text-muted">{selected.email} · {selected.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(selected.id, 'approved')} className="btn-ghost border border-green/20 text-green text-xs px-3 py-1 flex items-center gap-1"><CheckCircle size={12} />Approve</button>
                    <button onClick={() => updateStatus(selected.id, 'rejected')} className="btn-ghost border border-red-500/20 text-red-400 text-xs px-3 py-1 flex items-center gap-1"><XCircle size={12} />Reject</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted">Country:</span> <span className="text-white">{selected.country}</span></div>
                  {selected.city && <div><span className="text-muted">City:</span> <span className="text-white">{selected.city}</span></div>}
                  {selected.university && <div><span className="text-muted">University:</span> <span className="text-white">{selected.university}</span></div>}
                  {selected.degree && <div><span className="text-muted">Degree:</span> <span className="text-white">{selected.degree}</span></div>}
                  {selected.current_year && <div><span className="text-muted">Year:</span> <span className="text-white">{selected.current_year}</span></div>}
                  {selected.linkedin && <div className="col-span-2"><span className="text-muted">LinkedIn:</span> <a href={selected.linkedin} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline ml-1">{selected.linkedin}</a></div>}
                  {selected.portfolio && <div className="col-span-2"><span className="text-muted">Portfolio:</span> <a href={selected.portfolio} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline ml-1">{selected.portfolio}</a></div>}
                </div>

                {selected.departments?.length > 0 && (
                  <div><span className="text-muted text-sm">Departments:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">{selected.departments.map(d => <span key={d} className="text-xs bg-green/10 text-green px-2 py-0.5 rounded-full">{d}</span>)}</div>
                  </div>
                )}

                {selected.skills?.length > 0 && (
                  <div><span className="text-muted text-sm">Skills:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">{selected.skills.map(s => <span key={s} className="text-xs bg-white/10 text-muted px-2 py-0.5 rounded-full">{s}</span>)}</div>
                  </div>
                )}
                {selected.other_skills && <div><span className="text-muted text-sm block mb-1">Other skills</span><p className="text-sm text-white">{selected.other_skills}</p></div>}

                {selected.reason && <div><span className="text-muted text-sm block mb-1">Why join?</span><p className="text-sm text-white whitespace-pre-wrap">{selected.reason}</p></div>}
                {selected.about && <div><span className="text-muted text-sm block mb-1">About</span><p className="text-sm text-white whitespace-pre-wrap">{selected.about}</p></div>}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selected.hours_per_week && <div><span className="text-muted">Hours/week:</span> <span className="text-white">{selected.hours_per_week}</span></div>}
                  {selected.preferred_time && <div><span className="text-muted">Preferred time:</span> <span className="text-white">{selected.preferred_time}</span></div>}
                  {selected.preferred_channel && <div><span className="text-muted">Channel:</span> <span className="text-white">{selected.preferred_channel}</span></div>}
                  {selected.volunteered_before && <div className="col-span-2"><span className="text-muted">Previous experience:</span> <span className="text-white">{selected.prev_organizations} · {selected.prev_roles} · {selected.prev_duration}</span></div>}
                </div>

                {selected.biggest_strength && <div><span className="text-muted text-sm block mb-1">Biggest strength</span><p className="text-sm text-white">{selected.biggest_strength}</p></div>}
                {selected.skill_to_develop && <div><span className="text-muted text-sm block mb-1">Skill to develop</span><p className="text-sm text-white">{selected.skill_to_develop}</p></div>}
                {selected.proud_project && <div><span className="text-muted text-sm block mb-1">Proud project</span><p className="text-sm text-white">{selected.proud_project}</p></div>}
                {selected.heard_from && <div><span className="text-muted text-sm block mb-1">Heard from</span><p className="text-sm text-white">{selected.heard_from}</p></div>}

                <p className="text-xs text-muted/60">Applied: {new Date(selected.created_at).toLocaleString()}</p>
              </div>
            ) : (
              <div className="glass-card text-center py-20 text-muted">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select an application to view details.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
