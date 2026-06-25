import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { LayoutDashboard, Target, Activity, User, LogOut, CheckCircle, ExternalLink, Zap, Loader2 } from 'lucide-react'

export default function Blueprint() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [blueprint, setBlueprint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [updatingStep, setUpdatingStep] = useState(null)

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
        .maybeSingle()

      if (error) {
        console.error('Blueprint: fetch error:', error.message, error.code, error.details)
        toast.error('Failed to load blueprint')
      } else if (data) {
        setBlueprint(data)
      } else {
        console.log('Blueprint: no active blueprint found for user', user.id)
      }
    } catch (err) {
      toast.error('Failed to load blueprint')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateBlueprint() {
    setGenerating(true)
    const loadToast = toast.loading('Triggering AI Blueprint Engine...')
    try {
      const { data, error } = await supabase.functions.invoke('generate-career-blueprint', { body: {} })
      if (error) {
        console.error('Blueprint: edge function invoke error:', error)
        if (error.context) {
          console.error('Blueprint: edge function status:', error.context.status, 'statusText:', error.context.statusText)
          if (error.context.body) {
            console.error('Blueprint: edge function response body:', error.context.body)
          }
        }
        throw new Error(typeof error === 'object' ? error.message : 'Edge function returned an error')
      }
      toast.success('Blueprint generated successfully!', { id: loadToast })
      await fetchBlueprint()
    } catch (err) {
      toast.error(err.message || 'Failed to generate blueprint', { id: loadToast })
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  async function handleRecalculateScore() {
    const loadToast = toast.loading('Re-calculating career score...')
    try {
      const { data, error } = await supabase.functions.invoke('recalculate-score', { body: {} })
      if (error) {
        console.error('Blueprint: recalculate-score invoke error:', error)
        if (error.context) {
          console.error('Blueprint: recalculate-score status:', error.context.status)
        }
        throw new Error(typeof error === 'object' ? error.message : 'Score calculation failed')
      }
      toast.success('Score updated successfully!', { id: loadToast })
    } catch (err) {
      toast.error(err.message || 'Score calculation failed', { id: loadToast })
      console.error(err)
    }
  }

  async function toggleStep(index, currentStatus) {
    if (!blueprint) return
    setUpdatingStep(index)
    const newSteps = [...blueprint.action_steps]
    newSteps[index].completed = !currentStatus

    try {
      const { error } = await supabase
        .from('career_blueprints')
        .update({ action_steps: newSteps })
        .eq('id', blueprint.id)

      if (error) {
        console.error('Blueprint: step toggle error:', error.message, error.code, error.details)
        throw error
      }
      setBlueprint({ ...blueprint, action_steps: newSteps })

      await supabase.functions.invoke('recalculate-score', { body: {} }).catch(() => {})
    } catch (err) {
      toast.error('Failed to update step')
      console.error(err)
    } finally {
      setUpdatingStep(null)
    }
  }

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
          <button type="button" onClick={signOut} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-colors font-medium">
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
            <h2 className="text-2xl font-bold mb-2">AI Blueprint Not Ready</h2>
            <p className="text-muted mb-6 break-words">Generate your personalized career blueprint to get started.</p>
            <button
              type="button"
              onClick={handleGenerateBlueprint}
              disabled={generating}
              className="btn-primary inline-flex items-center gap-2"
            >
              {generating ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
              {generating ? 'Generating...' : 'Generate AI Blueprint'}
            </button>
          </div>
        ) : (
          <div className="space-y-8 max-w-5xl">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-4xl font-bold font-sora text-green mb-3 tracking-tight break-words">{blueprint.title}</h1>
                <p className="text-lg text-muted break-words">{blueprint.summary}</p>
              </div>
              <button
                type="button"
                onClick={handleGenerateBlueprint}
                disabled={generating}
                className="btn-ghost border border-border flex items-center gap-2 text-sm shrink-0"
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                {generating ? 'Regenerating...' : 'Regenerate'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                          {updatingStep === i ? (
                            <Loader2 size={14} className="animate-spin text-white" />
                          ) : step.completed ? (
                            <CheckCircle size={16} className="text-surface" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className={`font-bold text-lg break-words ${step.completed ? 'text-muted line-through' : 'text-white'}`}>
                            {step.title}
                          </h3>
                          {step.deadline && (
                            <p className="text-sm text-blue-accent mt-1 break-words">Deadline: {step.deadline}</p>
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
                        <p className="text-white font-medium break-words">{m}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1 space-y-6">
                <div className="glass-card">
                  <h2 className="font-bold text-lg mb-4 text-purple-accent break-words">Recommended Skills</h2>
                  <div className="space-y-3">
                    {blueprint.recommended_skills?.map((skill, i) => (
                      <div key={i} className="p-3 bg-white/[0.02] border border-border rounded-lg">
                        <div className="flex justify-between items-center mb-1 gap-2">
                          <span className="font-bold break-words">{skill.skill}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
                            skill.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                            skill.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-green/20 text-green'
                          }`}>
                            {skill.priority}
                          </span>
                        </div>
                        {skill.resource_url && (
                          <a href={skill.resource_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-2 truncate block">
                            Resource <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card border border-gold/20 bg-gold/5">
                  <h2 className="font-bold text-lg mb-4 text-gold">Matched Jobs</h2>
                  <p className="text-sm text-muted mb-4 break-words">Based on your blueprint, check the live jobs board.</p>
                  <Link to="/jobs" className="btn-primary w-full text-center py-2">View Matches</Link>
                </div>

                <button
                  type="button"
                  onClick={handleRecalculateScore}
                  className="btn-ghost border border-border w-full text-sm"
                >
                  Recalculate Score
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
