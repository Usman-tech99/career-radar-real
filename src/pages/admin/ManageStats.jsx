import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/layout/AdminSidebar'
import toast from 'react-hot-toast'
import { BarChart3, Save } from 'lucide-react'

const STAT_FIELDS = [
  { key: 'community_members', label: 'Community Members' },
  { key: 'countries', label: 'Countries' },
  { key: 'whatsapp_groups', label: 'WhatsApp Groups' },
  { key: 'main_channel_followers', label: 'Main Career Channel Followers' },
  { key: 'scholarship_channel_followers', label: 'Scholarship & Internship Channel Followers' },
  { key: 'ai_channel_followers', label: 'AI Learning Channel Followers' },
]

export default function ManageStats() {
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    setLoading(true)
    const { data, error } = await supabase.from('site_stats').select('*').single()
    if (error) {
      toast.error('Failed to load stats')
    } else if (data) {
      setStats(data)
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const updates = {}
    STAT_FIELDS.forEach(f => { updates[f.key] = Number(stats[f.key]) || 0 })
    updates.updated_at = new Date().toISOString()

    const { error } = await supabase.from('site_stats').update(updates).eq('id', 1)
    if (error) {
      toast.error('Failed to save: ' + error.message)
    } else {
      toast.success('Stats updated!')
    }
    setSaving(false)
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="text-green" /> Manage Stats
            </h1>
            <p className="text-muted text-sm mt-1">Update homepage statistics shown to all visitors.</p>
          </div>
          <button onClick={handleSave} disabled={saving || loading} className="btn-primary flex items-center gap-2">
            <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="glass-card max-w-2xl">
          {loading ? (
            <div className="skeleton w-full h-64 rounded-xl"></div>
          ) : (
            <div className="space-y-6">
              {STAT_FIELDS.map(f => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  <input
                    type="number"
                    value={stats[f.key] ?? 0}
                    onChange={e => setStats({ ...stats, [f.key]: e.target.value })}
                    className="input-field"
                    min="0"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
