import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { LayoutDashboard, Target, Activity, User, LogOut, CheckCircle, ExternalLink, Zap } from 'lucide-react'

export default function Blueprint() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [blueprint, setBlueprint] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchBlueprint()
  }, [user])

  async function fetchBlueprint() {
    try {
      const { data, error } = await supabase
        .from('career_blueprints')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle() // Adjusted to safely receive null without failing completely

      if (data) setBlueprint(data)
    } catch (err) {
      toast.error('Failed to load blueprint')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleStep(index, currentStatus) {
    if (!blueprint) return
    const newSteps = [...blueprint.action_steps]
    newSteps[index].completed = !currentStatus

    try {
      const { error } = await supabase
        .from('career_blueprints')
        .update({ action_steps: newSteps })
        .eq('id', blueprint.id)

      if (error) throw error
      setBlueprint({ ...blueprint, action_steps: newSteps })
      
      const { data: { session } } = await supabase.auth.getSession()
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recalculate-score`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json'
        }
      }).catch(e => console.warn(e))

    } catch (err) {
      toast.error('Failed to update step')
    }
  }

  // Sidebar link component with dynamic active state
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
        ) : !blueprint ? (
          <div className="glass-card text-center py-20 flex flex-col items-center">
            <Zap size={48} className="text-muted mb-4" />
            <h2 className="text-2xl font-bold mb-2">AI Blueprint Compiling</h2>
            <p className="text-muted mb-6">Your profile is safely registered. We are building your personalized dashboard recommendations right now.</p>
            <button 
              onClick={async () => {
                const loadToast = toast.loading("Re-triggering score optimization pipeline...");
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recalculate-score`, {
                    method: 'POST',
                    headers: { 
                      'Authorization': `Bearer ${session?.access_token}`,
                      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                      'Content-Type': 'application/json'
                    }
                  });
                  toast.success("Optimization request synchronized successfully!", { id: loadToast });
                } catch (e) {
                  toast.error("Engine processing queue full. Retrying shortly.", { id: loadToast });
                }
              }} 
              className="btn-primary"
            >
              Refresh Generation Engine
            </button>
          </div>
        ) : (
          <div className="space-y-8 max-w-5xl">
            <div>
              <h1 className="text-4xl font-bold font-sora text-green mb-3 tracking-tight">{blueprint.title}</h1>
              <p className="text-lg text-muted">{blueprint.summary}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Action Plan */}
              <div className="lg:col-span-2 space-y-8">
                <div className="glass-card">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Target className="text-blue-accent" /> Action Plan
                  </h2>
                  <div className="space-y-4">
                    {blueprint.action_steps?.map((step, i) => (
                      <div 
                        key={i} 
                        onClick={() => toggleStep(i, step.completed)}
                        className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:bg-white/[0.04] ${
                          step.completed ? 'bg-white/[0.02] border-border' : 'bg-white/[0.05] border-white/10'
                        }`}
                      >
                        <div className={`mt-1 shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                          step.completed ? 'bg-green border-green' : 'border-muted'
                        }`}>
                          {step.completed && <CheckCircle size={16} className="text-surface" />}
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-bold text-lg ${step.completed ? 'text-muted line-through' : 'text-white'}`}>
                            {step.title}
                          </h3>
                          {step.deadline && (
                            <p className="text-sm text-blue-accent mt-1">Deadline: {step.deadline}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card">
                  <h2 className="text-xl font-bold mb-6">Key Milestones</h2>
                  <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-border">
                    {blueprint.milestones?.map((m, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-surface border-2 border-green"></div>
                        <p className="text-white font-medium">{m}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="lg:col-span-1 space-y-6">
                <div className="glass-card">
                  <h2 className="font-bold text-lg mb-4 text-purple-accent">Recommended Skills</h2>
                  <div className="space-y-3">
                    {blueprint.recommended_skills?.map((skill, i) => (
                      <div key={i} className="p-3 bg-white/[0.02] border border-border rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold">{skill.skill}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            skill.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                            skill.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-green/20 text-green'
                          }`}>
                            {skill.priority}
                          </span>
                        </div>
                        {skill.resource_url && (
                          <a href={skill.resource_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-2">
                            Resource <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card border border-gold/20 bg-gold/5">
                  <h2 className="font-bold text-lg mb-4 text-gold">Matched Jobs</h2>
                  <p className="text-sm text-muted mb-4">Based on your blueprint, check the live jobs board.</p>
                  <Link to="/jobs" className="btn-primary w-full text-center py-2">View Matches</Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}