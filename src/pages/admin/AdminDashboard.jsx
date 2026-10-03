import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  Users, Briefcase, Share2, ShoppingBag, Award, FilePlus2,
  ArrowRight, ShieldCheck, TrendingUp, Sparkles, CheckCircle2,
} from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [certCount, setCertCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data } = await supabase.from('site_stats').select('*').eq('id', 1).single()
        setStats(data)
      } catch (err) {
        console.warn('Failed to fetch site_stats:', err)
      }

      try {
        const { count } = await supabase.from('certificates').select('*', { count: 'exact', head: true })
        if (count !== null && count !== undefined) setCertCount(count)
      } catch {}

      setLoading(false)
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-8 max-w-7xl">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Overview of the platform, activity metrics, and management tools.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/certificates/issue-appreciation"
            className="btn-primary text-sm px-4 py-2.5 inline-flex items-center gap-2 font-semibold shadow-lg shadow-gold/20"
          >
            <Award size={16} /> Issue Certificate
          </Link>
        </div>
      </div>

      {/* ── Primary Metrics Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card h-28 rounded-2xl animate-pulse bg-white/[0.02]" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Community Members"
            value={stats.community_members ?? 0}
            icon={Users}
            tone="from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/20"
          />
          <StatCard
            title="Jobs Posted"
            value={stats.jobs_posted ?? 0}
            icon={Briefcase}
            tone="from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/20"
          />
          <StatCard
            title="Resources Shared"
            value={stats.resources_shared ?? 0}
            icon={Share2}
            tone="from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/20"
          />
          <StatCard
            title="Total Products"
            value={stats.total_products ?? 0}
            icon={ShoppingBag}
            tone="from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/20"
          />
        </div>
      ) : (
        <div className="glass-card text-center text-slate-400 py-8">
          Unable to load stats. Check database connectivity.
        </div>
      )}

      {/* ── Quick Administrative Actions ── */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-gold" /> Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <QuickActionCard
            title="Issue Certificate of Appreciation"
            description="Generate official Career Radar Certificate for team volunteers."
            to="/admin/certificates/issue-appreciation"
            icon={Award}
            badge="Official Design"
          />
          <QuickActionCard
            title="All Issued Certificates"
            description="Audit, search, verify status, and revoke or re-issue certificates."
            to="/admin/certificates"
            icon={ShieldCheck}
            metric={`${certCount} issued`}
          />
          <QuickActionCard
            title="Manage Jobs & Opportunities"
            description="Create, review, or edit career opportunities for the portal."
            to="/admin/manage-jobs"
            icon={Briefcase}
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, tone }) {
  return (
    <div className="glass-card flex items-center gap-5 p-5 border border-white/[0.08] hover:border-white/[0.16] transition-colors">
      <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${tone} border flex items-center justify-center shrink-0`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold font-mono text-white mt-1">{value}</p>
      </div>
    </div>
  )
}

function QuickActionCard({ title, description, to, icon: Icon, badge, metric }) {
  return (
    <Link
      to={to}
      className="glass-card p-6 border border-white/[0.08] hover:border-gold/40 hover:bg-white/[0.06] transition-all group flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20">
            <Icon size={20} />
          </div>
          {badge && (
            <span className="text-[11px] font-semibold text-gold bg-gold/10 border border-gold/20 px-2.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
          {metric && (
            <span className="text-xs font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-md">
              {metric}
            </span>
          )}
        </div>
        <h3 className="text-base font-bold text-white group-hover:text-gold transition-colors">
          {title}
        </h3>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-medium text-slate-400 group-hover:text-gold transition-colors">
        <span>Open section</span>
        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  )
}
