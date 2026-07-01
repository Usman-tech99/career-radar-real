import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { BlurFade } from '../../components/magicui/blur-fade'
import { BorderBeam } from '../../components/magicui/border-beam'
import { AnimatedGradientText } from '../../components/magicui/animated-gradient-text'
import { NumberTicker } from '../../components/magicui/number-ticker'
import { LayoutDashboard, Target, Activity, User, LogOut, ArrowRight, Zap, Briefcase, Loader2, Sparkles, ChevronRight, Clock, FileText } from 'lucide-react'

const steps = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/dashboard/blueprint', icon: Target, label: 'AI Blueprint' },
  { to: '/dashboard/score', icon: Activity, label: 'Career Score' },
  { to: '/dashboard/resume', icon: FileText, label: 'Resume Builder' },
  { to: '/dashboard/profile', icon: User, label: 'Profile Settings' },
]

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [score, setScore] = useState(null)
  const [blueprint, setBlueprint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (user) fetchDashboardData()
  }, [user])

  async function fetchDashboardData() {
    try {
      const [scoreRes, blueprintRes] = await Promise.all([
        supabase.from('career_scores').select('total_score, missing_items').eq('user_id', user.id).maybeSingle(),
        supabase.from('career_blueprints').select('title, summary, action_steps').eq('user_id', user.id).eq('is_active', true).maybeSingle()
      ])

      if (scoreRes?.data) {
        setScore(scoreRes.data)
      } else if (!scoreRes?.error) {
        // No score found — auto-calculate
        supabase.functions.invoke('recalculate-score', { body: {} }).then(({ data, error }) => {
          if (data?.score) setScore({ total_score: data.score.total_score, missing_items: data.score.missing_items })
        }).catch(() => {})
      }

      if (blueprintRes.error) console.error('Dashboard: career_blueprints query error:', blueprintRes.error.message)
      else if (blueprintRes?.data) setBlueprint(blueprintRes.data)
    } catch (err) {
      console.error('Dashboard: fetchDashboardData exception:', err.message)
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
        let msg
        try { const parsed = JSON.parse(error.message); msg = parsed.error || error.message }
        catch { msg = error.message }
        console.error('Dashboard: edge function invoke error:', msg)
        throw new Error(msg)
      }
      toast.success('Blueprint generated successfully!', { id: loadToast })
      await fetchDashboardData()
    } catch (err) {
      toast.error(err.message || 'Failed to generate blueprint', { id: loadToast })
      console.error('Dashboard: handleGenerateBlueprint error:', err.message)
    } finally {
      setGenerating(false)
    }
  }

  const NavLink = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to
    return (
      <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium relative ${
        isActive
          ? 'text-green'
          : 'text-muted hover:bg-white/[0.04] hover:text-white'
      }`}>
        {isActive && (
          <motion.div layoutId="activeNav" className="absolute inset-0 rounded-xl bg-green/10 border border-green/20" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
        )}
        <Icon size={20} className="relative z-10" />
        <span className="relative z-10">{label}</span>
      </Link>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#07070C]">
      {/* Sidebar */}
      <div className="w-64 h-screen bg-[#0A0A12]/90 backdrop-blur-xl border-r border-white/[0.05] flex flex-col fixed left-0 top-0 pt-20 z-20">
        <div className="flex-1 px-3 py-6 space-y-1">
          {steps.map(s => <NavLink key={s.to} {...s} />)}
        </div>
        <div className="p-3 border-t border-white/[0.05]">
          <button type="button" onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 font-medium text-sm">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 ml-64 p-6 md:p-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-sora">
              Welcome back<AnimatedGradientText colorFrom="#10B981" colorTo="#3B82F6" className="text-3xl md:text-4xl font-bold">,</AnimatedGradientText>
            </h1>
            <p className="text-muted mt-1 flex items-center gap-2">
              <Sparkles size={14} className="text-gold" /> Here's your career snapshot for today.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted bg-white/[0.03] border border-white/[0.05] px-4 py-2 rounded-full">
            <Clock size={12} /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </motion.div>

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 glass-card p-6 animate-pulse rounded-2xl space-y-4">
              <div className="h-5 w-32 rounded bg-white/[0.06]" />
              <div className="h-16 w-24 rounded bg-white/[0.06]" />
              <div className="h-4 w-40 rounded bg-white/[0.06]" />
              <div className="flex flex-wrap gap-2">
                <div className="h-6 w-20 rounded bg-white/[0.06]" />
                <div className="h-6 w-24 rounded bg-white/[0.06]" />
              </div>
            </div>
            <div className="lg:col-span-2 glass-card p-6 animate-pulse rounded-2xl space-y-4">
              <div className="h-5 w-36 rounded bg-white/[0.06]" />
              <div className="h-7 w-3/4 rounded bg-white/[0.06]" />
              <div className="h-4 w-full rounded bg-white/[0.06]" />
              <div className="h-4 w-5/6 rounded bg-white/[0.06]" />
              <div className="space-y-2">
                <div className="h-14 w-full rounded-xl bg-white/[0.06]" />
                <div className="h-14 w-full rounded-xl bg-white/[0.06]" />
                <div className="h-14 w-full rounded-xl bg-white/[0.06]" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Score Card */}
            <BlurFade delay={0} offset={10} blur="3px" className="lg:col-span-1 relative group">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-green/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="glass-card relative h-full flex flex-col justify-between p-6 rounded-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-green/10 blur-[70px] rounded-full pointer-events-none" />
                <div>
                  <div className="flex items-center gap-2 text-muted mb-4">
                    <Activity size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Career Score</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-6xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-green to-emerald-300">
                      <NumberTicker value={score?.total_score || 0} />
                    </span>
                    <span className="text-lg text-muted font-mono mb-2">/100</span>
                  </div>
                  {score?.missing_items && score.missing_items.length > 0 && (
                    <div className="mt-6">
                      <p className="text-xs font-bold text-amber-400/80 uppercase tracking-wider mb-3">Missing to improve</p>
                      <div className="flex flex-wrap gap-2">
                        {score.missing_items.map((item, i) => (
                          <span key={i} className="text-[11px] bg-amber-400/10 text-amber-400/90 px-2.5 py-1 rounded-full border border-amber-400/20">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Link to="/dashboard/score" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-green/70 hover:text-green transition-colors group/link">
                  View Breakdown <ChevronRight size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </BlurFade>

            {/* Blueprint Card */}
            <BlurFade delay={0.1} offset={10} blur="3px" className="lg:col-span-2 relative group">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-blue-accent/20 via-green/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="glass-card relative h-full flex flex-col justify-between p-6 rounded-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-accent/10 blur-[70px] rounded-full pointer-events-none" />
                <div>
                  <div className="flex items-center gap-2 text-muted mb-4">
                    <Target size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Active Blueprint</span>
                  </div>
                  {blueprint ? (
                    <>
                      <h3 className="text-2xl md:text-3xl font-bold font-sora text-white mb-2 break-words">{blueprint.title}</h3>
                      <p className="text-sm text-muted/80 mb-6 break-words leading-relaxed">{blueprint.summary}</p>
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-green/80 mb-3">Next Steps</p>
                        {blueprint.action_steps?.slice(0, 3).map((step, i) => (
                          <div key={i} className="flex items-start gap-3 p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:bg-white/[0.04] hover:border-white/10 transition-all group/step">
                            <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                              step.completed ? 'bg-green border-green' : 'border-muted/50 group-hover/step:border-muted'
                            }`}>
                              {step.completed && <div className="w-2 h-2 bg-[#07070C] rounded-sm" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm break-words ${step.completed ? 'line-through text-muted/50' : 'text-white/90 font-medium'}`}>{step.title}</p>
                              {step.deadline && <p className="text-xs text-muted/60 mt-0.5 flex items-center gap-1"><Clock size={10} /> Due: {step.deadline}</p>}
                            </div>
                            <ChevronRight size={14} className="text-muted/30 group-hover/step:text-muted/60 transition-colors self-center shrink-0" />
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold/20 to-amber-500/10 flex items-center justify-center mx-auto mb-4">
                        <Zap size={24} className="text-gold" />
                      </div>
                      <p className="text-muted mb-2 font-medium">No active blueprint yet</p>
                      <p className="text-xs text-muted/60 mb-5">Generate your AI-powered career roadmap to get started.</p>
                      <button type="button" onClick={handleGenerateBlueprint} disabled={generating}
                        className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm">
                        {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {generating ? 'Generating...' : 'Generate Blueprint'}
                      </button>
                    </div>
                  )}
                </div>
                {blueprint && (
                  <Link to="/dashboard/blueprint" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-accent/70 hover:text-blue-accent transition-colors group/link">
                    Open Full Blueprint <ChevronRight size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                  </Link>
                )}
              </div>
            </BlurFade>

            {/* Bottom Cards */}
            <BlurFade delay={0.2} offset={10} blur="3px" className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 relative group">
              {/* Recommended Jobs */}
              <div className="relative group/card">
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-gold/20 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <BorderBeam size={60} duration={8} colorFrom="#F59E0B" colorTo="#F59E0B" borderWidth={1} />
                <div className="glass-card relative p-6 rounded-2xl flex items-start gap-4 overflow-hidden">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-amber-500/10 flex items-center justify-center shrink-0 border border-gold/10">
                    <Briefcase size={20} className="text-gold" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white mb-1">Recommended Jobs</h3>
                    <p className="text-sm text-muted/70 leading-relaxed">Based on your blueprint, Radar AI has found matching opportunities.</p>
                    <Link to="/jobs" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold hover:text-gold/80 transition-colors">
                      Browse Jobs <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* AI Assistant */}
              <div className="relative group/card">
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-purple-accent/20 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <BorderBeam size={60} duration={8} colorFrom="#8B5CF6" colorTo="#8B5CF6" borderWidth={1} />
                <div className="glass-card relative p-6 rounded-2xl flex items-start gap-4 overflow-hidden">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-accent/20 to-pink-500/10 flex items-center justify-center shrink-0 border border-purple-accent/10">
                    <Zap size={20} className="text-purple-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white mb-1">Radar AI Assistant</h3>
                    <p className="text-sm text-muted/70 leading-relaxed">Stuck? Ask the AI coach for interview tips, resume reviews, or career advice.</p>
                    <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('open-radar-ai'))}
                      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-purple-accent hover:text-purple-accent/80 transition-colors">
                      Open Chat <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </BlurFade>

          </div>
        )}
      </div>
    </div>
  )
}