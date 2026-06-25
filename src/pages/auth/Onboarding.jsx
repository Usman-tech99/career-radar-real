import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { LayoutDashboard, Target, Activity, User, LogOut, ArrowRight, Zap, Briefcase } from 'lucide-react'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [score, setScore] = useState(null)
  const [blueprint, setBlueprint] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchDashboardData()
  }, [user])

  async function fetchDashboardData() {
    try {
      // Using .maybeSingle() prevents PGRST116 errors if records don't exist yet
      const scoreRes = await supabase
        .from('career_scores')
        .select('total_score, missing_items')
        .eq('user_id', user.id)
        .maybeSingle()

      const blueprintRes = await supabase
        .from('career_blueprints')
        .select('title, summary, action_steps')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (scoreRes?.data) setScore(scoreRes.data)
      if (blueprintRes?.data) setBlueprint(blueprintRes.data)
    } catch (err) {
      console.error("Dashboard fetching failure:", err)
    } finally {
      setLoading(false)
    }
  }

  // Sidebar link component
  const NavLink = ({ to, icon: Icon, label, active }) => (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
      active ? 'bg-green/10 text-green border border-green/20' : 'text-muted hover:bg-white/[0.04] hover:text-white'
    }`}>
      <Icon size={20} className={active ? 'text-green' : 'text-muted'} />
      {label}
    </Link>
  )

  return (
    <div className="flex min-h-screen bg-surface">
      {/* User Sidebar */}
      <div className="w-64 h-screen bg-surface border-r border-border flex flex-col fixed left-0 top-0 pt-20">
        <div className="flex-1 px-4 py-6 space-y-2">
          <NavLink to="/dashboard" icon={LayoutDashboard} label="Overview" active={true} />
          <NavLink to="/dashboard/blueprint" icon={Target} label="AI Blueprint" />
          <NavLink to="/dashboard/score" icon={Activity} label="Career Score" />
          <NavLink to="/dashboard/profile" icon={User} label="Profile Settings" />
        </div>
        <div className="p-4 border-t border-border">
          <button onClick={signOut} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-colors font-medium">
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome Back!</h1>
            <p className="text-muted mt-1">Here's your career snapshot for today.</p>
          </div>
        </div>

        {loading ? (
          <div className="skeleton w-full h-64 rounded-2xl"></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Score Card */}
            <div className="lg:col-span-1 glass-card relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green/20 blur-[50px] rounded-full pointer-events-none" />
              <div>
                <h2 className="text-lg font-bold text-muted flex items-center gap-2">
                  <Activity size={18} /> Current Score
                </h2>
                <div className="text-6xl font-black font-mono mt-4 text-green">
                  {score?.total_score || 0}<span className="text-2xl text-muted">/100</span>
                </div>
                
                {score?.missing_items && score.missing_items.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm font-bold text-amber-400 mb-2">Missing to improve:</p>
                    <div className="flex flex-wrap gap-2">
                      {score.missing_items.map((item, i) => (
                        <span key={i} className="text-xs bg-amber-400/10 text-amber-400 px-2 py-1 rounded border border-amber-400/20">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Link to="/dashboard/score" className="btn-ghost mt-6 text-sm flex justify-center items-center gap-2 border border-border">
                View Breakdown <ArrowRight size={16} />
              </Link>
            </div>

            {/* Blueprint Snapshot */}
            <div className="lg:col-span-2 glass-card flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-muted flex items-center gap-2 mb-4">
                  <Target size={18} /> Active Blueprint
                </h2>
                {blueprint ? (
                  <>
                    <h3 className="text-2xl font-bold mb-2">{blueprint.title}</h3>
                    <p className="text-muted mb-6">{blueprint.summary}</p>
                    
                    <div className="space-y-3">
                      <p className="text-sm font-bold uppercase tracking-wider text-green">Next Steps</p>
                      {blueprint.action_steps?.slice(0, 3).map((step, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-border rounded-xl">
                          <div className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center ${step.completed ? 'bg-green border-green' : 'border-muted'}`}>
                            {step.completed && <div className="w-2 h-2 bg-surface rounded-sm" />}
                          </div>
                          <div>
                            <p className={`text-sm ${step.completed ? 'line-through text-muted' : 'font-medium'}`}>{step.title}</p>
                            {step.deadline && <p className="text-xs text-muted mt-1">Due: {step.deadline}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Zap size={32} className="text-gold mx-auto mb-4" />
                    <p className="text-muted">Your profile is registered! Your blueprint is compiling...</p>
                    <button 
                      onClick={async () => {
                        const loadToast = toast.loading("Requesting AI blueprint generation...");
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          if (!session?.access_token) throw new Error("No active session");
                          
                          // ✅ Attached mandatory 'apikey' header below to verify your project with Supabase
                          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recalculate-score`, {
                            method: 'POST',
                            headers: { 
                              'Authorization': `Bearer ${session.access_token}`,
                              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                              'Content-Type': 'application/json'
                            }
                          });
                          toast.success("Generation requested! Refresh in a moment.", { id: loadToast });
                        } catch (e) {
                          toast.error("Engine busy. Trying again shortly.", { id: loadToast });
                        }
                      }} 
                      className="btn-primary mt-4"
                    >
                      Trigger AI Blueprint Engine
                    </button>
                  </div>
                )}
              </div>
              <Link to="/dashboard/blueprint" className="btn-primary mt-6 text-sm flex justify-center items-center gap-2">
                Open Full Blueprint <ArrowRight size={16} />
              </Link>
            </div>

            {/* Quick Actions / Recommendations */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-card">
                <h3 className="font-bold flex items-center gap-2 mb-4"><Briefcase size={18} /> Recommended Jobs</h3>
                <p className="text-sm text-muted">Based on your blueprint, Radar AI has found matches.</p>
                <Link to="/jobs" className="text-green text-sm font-bold mt-4 inline-block hover:underline">Browse Jobs ↗</Link>
              </div>
              <div className="glass-card">
                <h3 className="font-bold flex items-center gap-2 mb-4"><Zap size={18} /> Radar AI Assistant</h3>
                <p className="text-sm text-muted">Stuck? Ask the AI coach for interview tips or resume reviews.</p>
                <button onClick={() => window.dispatchEvent(new CustomEvent('open-radar-ai'))} className="text-purple-accent text-sm font-bold mt-4 inline-block hover:underline">Open Chat ↗</button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}