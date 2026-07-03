import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { BlurFade } from '../../components/magicui/blur-fade'
import { BorderBeam } from '../../components/magicui/border-beam'
import { NumberTicker } from '../../components/magicui/number-ticker'
import { Activity, User, Target, FileText, TrendingUp, AlertTriangle, RotateCcw, Sparkles, BarChart3 } from 'lucide-react'

const ScoreBar = ({ label, value, max, color, icon: Icon }) => (
  <div className="mb-5 group">
    <div className="flex justify-between items-end mb-2">
      <span className="font-bold text-sm text-white flex items-center gap-2">
        {Icon && <Icon size={14} className={color.replace('bg-', 'text-').replace('bg-', '')} />}
        {label}
      </span>
      <span className="text-xs font-mono text-muted">{value} / {max}</span>
    </div>
    <div className="h-3 w-full bg-white/[0.04] rounded-full overflow-hidden relative">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        className={`h-full rounded-full ${color} relative`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-slide opacity-0 group-hover:opacity-100" />
      </motion.div>
    </div>
  </div>
)

export default function Score() {
  const { user } = useAuth()
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    if (user) fetchScore()
  }, [user])

  async function fetchScore() {
    try {
      const { data, error } = await supabase
        .from('career_scores')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        setScore(data)
      } else if (!error) {
        // Auto-calculate if no score exists
        supabase.functions.invoke('recalculate-score', { body: {} }).then(({ data: d }) => {
          if (d?.score) setScore(d.score)
        }).catch(() => {})
      }
    } catch (err) {
      toast.error('Failed to load score')
      console.error('Score: load error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRecalculate() {
    setCalculating(true)
    const loadToast = toast.loading('Recalculating career score...')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const rawRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recalculate-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: '{}'
      })
      const rawBody = await rawRes.text()
      if (!rawRes.ok) throw new Error(rawBody)
      const json = JSON.parse(rawBody)
      if (json?.score) setScore(json.score)
      toast.success('Score recalculated!', { id: loadToast })
    } catch (err) {
      toast.error(err.message || 'Calculation failed', { id: loadToast })
      console.error('Score: recalculate error:', err.message)
    } finally {
      setCalculating(false)
    }
  }

  const getScoreColor = (s) => {
    if (s >= 80) return 'from-green to-emerald-300'
    if (s >= 60) return 'from-blue-accent to-blue-300'
    if (s >= 40) return 'from-gold to-amber-300'
    return 'from-red-500 to-rose-300'
  }

  return (
    <div className="p-6 md:p-10">
        {loading ? (
          <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
            <div className="h-8 w-48 rounded bg-white/[0.06]" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <div className="h-5 w-36 rounded bg-white/[0.06]" />
                <div className="h-5 w-full rounded bg-white/[0.06]" />
                <div className="h-5 w-full rounded bg-white/[0.06]" />
                <div className="h-5 w-full rounded bg-white/[0.06]" />
                <div className="h-5 w-full rounded bg-white/[0.06]" />
                <div className="h-5 w-full rounded bg-white/[0.06]" />
              </div>
              <div className="space-y-6">
                <div className="glass-card p-6 rounded-2xl h-40" />
                <div className="glass-card p-6 rounded-2xl h-40" />
              </div>
            </div>
          </div>
        ) : !score ? (
          <div className="max-w-5xl mx-auto glass-card text-center py-20 rounded-2xl">
            <BarChart3 size={48} className="text-muted mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Score Data</h2>
            <p className="text-muted mb-6">Complete your onboarding and generate a blueprint to calculate your score.</p>
            <button onClick={handleRecalculate} disabled={calculating}
              className="btn-primary inline-flex items-center gap-2">
              <RotateCcw size={16} className={calculating ? 'animate-spin' : ''} />
              {calculating ? 'Calculating...' : 'Calculate Now'}
            </button>
          </div>
        ) : (
          <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <BlurFade offset={8} blur="3px">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-8 border-b border-white/[0.05]">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold font-sora mb-1">Career <span className="text-green">Score</span></h1>
                  <p className="text-muted text-sm">Your employability index based on skills, profile, and activity.</p>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={handleRecalculate} disabled={calculating}
                    className="btn-ghost border border-border flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl">
                    <RotateCcw size={14} className={calculating ? 'animate-spin' : ''} />
                    {calculating ? 'Recalculating...' : 'Recalculate'}
                  </button>
                  <div className="glass-card flex items-center gap-4 px-6 py-4 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green/15 blur-[50px] rounded-full pointer-events-none" />
                    <Activity size={28} className="text-green relative z-10" />
                    <div className="relative z-10">
                      <div className="text-4xl md:text-5xl font-black font-mono leading-none">
                        <span className={`text-transparent bg-clip-text bg-gradient-to-r ${getScoreColor(score.total_score)}`}>
                          <NumberTicker value={score.total_score} />
                        </span>
                        <span className="text-lg text-muted font-bold ml-1">/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </BlurFade>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score Breakdown */}
              <BlurFade delay={0.1} offset={10} blur="3px">
                <div className="glass-card p-6 rounded-2xl relative">
                  <BorderBeam size={60} duration={10} colorFrom="#10B981" colorTo="#3B82F6" borderWidth={1} />
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <TrendingUp className="text-blue-accent" size={18} /> Score Breakdown
                  </h2>
                  <ScoreBar label="Skills Assessment" value={score.skills_score} max={25} color="bg-purple-accent" icon={Sparkles} />
                  <ScoreBar label="Profile Completeness" value={score.profile_score} max={20} color="bg-blue-accent" icon={User} />
                  <ScoreBar label="Blueprint Activity" value={score.activity_score} max={20} color="bg-green" icon={Target} />
                  <ScoreBar label="Education & Courses" value={score.education_score} max={20} color="bg-gold" icon={FileText} />
                  <ScoreBar label="Experience Level" value={score.experience_score} max={15} color="bg-indigo-400" icon={TrendingUp} />
                </div>
              </BlurFade>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Action Items */}
                <BlurFade delay={0.15} offset={10} blur="3px">
                  <div className="glass-card p-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.02] relative">
                    <BorderBeam size={50} duration={12} colorFrom="#F59E0B" colorTo="#F59E0B" borderWidth={1} />
                    <h2 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                      <AlertTriangle size={18} /> Action Items
                    </h2>
                    {score.missing_items?.length > 0 ? (
                      <ul className="space-y-3">
                        {score.missing_items.map((item, i) => (
                          <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-3 text-white/90 text-sm font-medium">
                            <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                            {item}
                          </motion.li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex items-center gap-3 text-green">
                        <Sparkles size={18} />
                        <p className="font-medium">Your profile is highly optimized!</p>
                      </div>
                    )}
                    <div className="mt-6 pt-4 border-t border-amber-500/10">
                      <p className="text-xs text-muted/70">
                        Complete the items above and recalculate to improve your score.
                      </p>
                    </div>
                  </div>
                </BlurFade>

                {/* Score History */}
                <BlurFade delay={0.2} offset={10} blur="3px">
                  <div className="glass-card p-6 rounded-2xl relative">
                    <BorderBeam size={50} duration={12} colorFrom="#8B5CF6" colorTo="#3B82F6" borderWidth={1} />
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <BarChart3 size={18} className="text-purple-accent" /> Score History
                    </h2>
                    <div className="h-36 flex items-end gap-1.5 border-b border-l border-white/[0.06] pl-2 pb-2">
                      {score.score_history?.length > 1 ? (
                        score.score_history.map((h, i) => {
                          const pct = Math.max(5, h.score)
                          return (
                            <div key={i} className="flex-1 relative group cursor-pointer" style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${pct}%` }}
                                transition={{ duration: 0.6, delay: i * 0.05 }}
                                className={`w-full rounded-t-sm transition-all duration-300 group-hover:opacity-80 ${h.score >= 70 ? 'bg-green/50' : h.score >= 40 ? 'bg-gold/50' : 'bg-red-500/50'}`}
                              >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-surface border border-white/[0.1] px-2 py-0.5 text-[10px] text-muted rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                                  {h.score} — {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                              </motion.div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <p className="text-xs text-muted/50">Not enough history yet. Recalculate to track progress.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </BlurFade>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}