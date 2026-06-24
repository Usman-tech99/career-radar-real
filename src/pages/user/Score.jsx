import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { LayoutDashboard, Target, Activity, User, LogOut, TrendingUp, AlertTriangle } from 'lucide-react'

export default function Score() {
  const { user, signOut } = useAuth()
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchScore()
  }, [user])

  async function fetchScore() {
    try {
      const { data, error } = await supabase
        .from('career_scores')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (data) setScore(data)
    } catch (err) {
      toast.error('Failed to load score')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const NavLink = ({ to, icon: Icon, label, active }) => (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
      active ? 'bg-green/10 text-green border border-green/20' : 'text-muted hover:bg-white/[0.04] hover:text-white'
    }`}>
      <Icon size={20} className={active ? 'text-green' : 'text-muted'} />
      {label}
    </Link>
  )

  // Progress bar component
  const ScoreBar = ({ label, value, max, color }) => (
    <div className="mb-6">
      <div className="flex justify-between items-end mb-2">
        <span className="font-bold text-sm text-white">{label}</span>
        <span className="text-xs font-mono text-muted">{value} / {max}</span>
      </div>
      <div className="h-3 w-full bg-white/[0.05] rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${color}`} 
          style={{ width: `${Math.min(100, (value / max) * 100)}%` }} 
        />
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-surface">
      <div className="w-64 h-screen bg-surface border-r border-border flex flex-col fixed left-0 top-0 pt-20">
        <div className="flex-1 px-4 py-6 space-y-2">
          <NavLink to="/dashboard" icon={LayoutDashboard} label="Overview" />
          <NavLink to="/dashboard/blueprint" icon={Target} label="AI Blueprint" />
          <NavLink to="/dashboard/score" icon={Activity} label="Career Score" active={true} />
          <NavLink to="/dashboard/profile" icon={User} label="Profile Settings" />
        </div>
        <div className="p-4 border-t border-border">
          <button onClick={signOut} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-colors font-medium">
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </div>

      <div className="flex-1 ml-64 p-8">
        {loading ? (
          <div className="skeleton w-full h-full min-h-[500px] rounded-2xl"></div>
        ) : !score ? (
          <div className="glass-card text-center py-20">
            <h2 className="text-2xl font-bold mb-2">No Score Data</h2>
            <p className="text-muted">Complete your onboarding to calculate your initial score.</p>
          </div>
        ) : (
          <div className="space-y-8 max-w-5xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-8">
              <div>
                <h1 className="text-4xl font-bold font-sora tracking-tight mb-2">Career Score</h1>
                <p className="text-muted">Your employability index based on skills, profile, and activity.</p>
              </div>
              <div className="glass-card flex items-center gap-6 px-8 py-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green/20 blur-[40px] rounded-full pointer-events-none" />
                <Activity size={40} className="text-green relative z-10" />
                <div className="relative z-10">
                  <div className="text-6xl font-black font-mono text-white leading-none">
                    {score.total_score}<span className="text-2xl text-muted font-bold">/100</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Score Breakdown */}
              <div className="glass-card">
                <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                  <TrendingUp className="text-blue-accent" /> Score Breakdown
                </h2>
                
                <ScoreBar label="Skills Assessment" value={score.skills_score} max={25} color="bg-purple-accent" />
                <ScoreBar label="Profile Completeness" value={score.profile_score} max={20} color="bg-blue-400" />
                <ScoreBar label="Blueprint Activity" value={score.activity_score} max={20} color="bg-green" />
                <ScoreBar label="Education & Courses" value={score.education_score} max={20} color="bg-gold" />
                <ScoreBar label="Experience Level" value={score.experience_score} max={15} color="bg-indigo-400" />
              </div>

              {/* Action Items */}
              <div className="space-y-6">
                <div className="glass-card border border-amber-500/20 bg-amber-500/5">
                  <h2 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                    <AlertTriangle size={20} /> Action Items to Improve
                  </h2>
                  {score.missing_items?.length > 0 ? (
                    <ul className="space-y-3">
                      {score.missing_items.map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-white font-medium">
                          <div className="w-2 h-2 rounded-full bg-amber-400" />
                          Complete: {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-green font-medium">Your profile is highly optimized! Keep completing blueprint tasks.</p>
                  )}
                  <div className="mt-6 pt-4 border-t border-amber-500/20">
                    <p className="text-xs text-muted">
                      To recalculate your score, complete actions and visit the AI Assistant or refresh your dashboard.
                    </p>
                  </div>
                </div>

                {/* Optional History Chart Placeholder */}
                <div className="glass-card">
                  <h2 className="text-lg font-bold mb-4">Score History</h2>
                  <div className="h-32 flex items-end gap-2 border-b border-l border-border pl-2 pb-2">
                    {score.score_history?.length > 0 ? (
                      score.score_history.map((h, i) => (
                        <div key={i} className="flex-1 bg-green/20 hover:bg-green/40 transition-colors rounded-t-sm relative group cursor-pointer" 
                             style={{ height: `${h.score}%` }}>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-surface border border-border px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                            {h.score} ({new Date(h.date).toLocaleDateString()})
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted flex-1 text-center self-center">Not enough history</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
