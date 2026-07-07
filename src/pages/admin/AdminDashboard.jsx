import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, Briefcase, Share2, ShoppingBag } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const { data } = await supabase.from('site_stats').select('*').eq('id', 1).single()
      setStats(data)
      setLoading(false)
    }
    fetchStats()
  }, [])

  return (
    <div>
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        {loading ? (
          <div className="skeleton w-full h-32 rounded-2xl"></div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Community Members" value={stats.community_members} icon={Users} color="text-blue-accent" />
            <StatCard title="Jobs Posted" value={stats.jobs_posted} icon={Briefcase} color="text-green" />
            <StatCard title="Resources Shared" value={stats.resources_shared} icon={Share2} color="text-purple-accent" />
            <StatCard title="Total Products" value={stats.total_products} icon={ShoppingBag} color="text-gold" />
          </div>
        ) : (
          <div className="glass-card text-center text-muted">Failed to load stats. Ensure DB is seeded.</div>
        )}
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="glass-card flex items-center gap-6">
      <div className={`p-4 rounded-full bg-white/[0.05] ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-muted text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold mt-1 font-mono">{value}</p>
      </div>
    </div>
  )
}
