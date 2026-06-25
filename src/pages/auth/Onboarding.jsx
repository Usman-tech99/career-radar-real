import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from z
import toast from 'react-hot-toast'
import { ArrowRight, ArrowLeft, LogOut } from 'lucide-react'

const onboardingSchema = z.object({
  degree: z.string().min(2, "Degree is required"),
  study_year: z.string().min(1, "Study year is required"),
  skills: z.string().min(2, "List at least one skill"),
  country: z.string().min(2, "Country is required"),
  city: z.string().min(2, "City is required"),
  career_goal: z.string().min(10, "Please describe your career goal in a few words"),
  experience: z.enum(['Student', 'Fresh Graduate', '1-2 Years', '3+ Years']),
  interests: z.string().optional()
})

export default function Onboarding() {
  const { user, setOnboardingComplete, refreshOnboardingStatus, signOut } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, trigger, formState: { errors } } = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { experience: 'Student' }
  })

  async function handleNext() {
    let fieldsToValidate = []
    if (step === 1) fieldsToValidate = ['degree', 'study_year', 'country', 'city']
    if (step === 2) fieldsToValidate = ['experience', 'skills', 'interests']

    const isStepValid = await trigger(fieldsToValidate)
    if (isStepValid) {
      setStep(step + 1)
    }
  }

  async function onSubmit(data) {
    if (!user?.id) {
      toast.error("User session not found. Please log in again.");
      return;
    }
    
    setLoading(true)

    const payload = {
      user_id: user.id,
      degree: data.degree,
      study_year: data.study_year,
      skills: data.skills.split(',').map(s => s.trim()).filter(Boolean),
      country: data.country,
      city: data.city,
      career_goal: data.career_goal,
      experience: data.experience,
      interests: data.interests ? data.interests.split(',').map(s => s.trim()).filter(Boolean) : []
    }

    try {
      // 1. Upsert onboarding data to avoid unique constraint key violations
      const { error: upsertError } = await supabase
        .from('onboarding_data')
        .upsert(payload, { onConflict: 'user_id' })
        
      if (upsertError) throw upsertError

      // 2. Set onboarding_complete to true in public_users table
      const { error: updateError } = await supabase
        .from('public_users')
        .update({ 
          country: data.country, 
          onboarding_complete: true 
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // 3. Immediately lower frontend route shields by forcing local state to true
      if (setOnboardingComplete) {
        setOnboardingComplete(true)
      }

      // 4. Update core global auth state context properties
      await refreshOnboardingStatus()
      
      toast.success('Onboarding complete! Loading your dashboard...')
      
      // 5. Navigate to the dashboard layout panel immediately 
      navigate('/dashboard', { replace: true })

      // 6. Isolated background dispatch for the edge score engine calculation
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recalculate-score`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          })
          .then(res => {
            if (!res.ok) console.warn(`recalculate-score backend service failure status: ${res.status}`);
          })
          .catch(e => console.warn("Background edge service calculation failed silently:", e));
        }
      } catch (e) {
        console.warn("Could not fetch user session for score processing background pipeline:", e)
      }

    } catch (error) {
      console.error("Submission operational failure:", error)
      toast.error(error.message || "An error occurred during profiling sync.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#07070C] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 w-full h-[500px] bg-green/10 blur-[150px] pointer-events-none" />

      {/* Sign out button */}
      <button 
        onClick={signOut}
        type="button"
        className="absolute top-4 right-4 flex items-center gap-2 text-muted hover:text-white transition-colors z-20"
      >
        <LogOut size={18} />
        Sign Out
      </button>

      <div className="w-full max-w-2xl relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold font-sora mb-2">Build Your Career Profile</h1>
          <p className="text-muted">We need some details to personalize your AI career blueprint.</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-2 flex-1 rounded-full transition-colors ${i <= step ? 'bg-green' : 'bg-white/[0.05]'}`} />
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-8 min-h-[400px] flex flex-col">
          
          {step === 1 && (
            <div className="space-y-6 flex-1 animate-fade-in">
              <h2 className="text-xl font-bold border-b border-border pb-2">Academic & Location Info</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="label">Current Degree / Field</label>
                  <input {...register('degree')} className="input-field" placeholder="e.g. BS Computer Science" />
                  {errors.degree && <p className="text-red-400 text-sm mt-1">{errors.degree.message}</p>}
                </div>
                <div>
                  <label className="label">Year of Study / Graduation</label>
                  <input {...register('study_year')} className="input-field" placeholder="e.g. 3rd Year or 2023" />
                  {errors.study_year && <p className="text-red-400 text-sm mt-1">{errors.study_year.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="label">Country</label>
                  <input {...register('country')} className="input-field" placeholder="e.g. Pakistan" />
                  {errors.country && <p className="text-red-400 text-sm mt-1">{errors.country.message}</p>}
                </div>
                <div>
                  <label className="label">City</label>
                  <input {...register('city')} className="input-field" placeholder="e.g. Lahore" />
                  {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city.message}</p>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 flex-1 animate-fade-in">
              <h2 className="text-xl font-bold border-b border-border pb-2">Skills & Experience</h2>
              
              <div>
                <label className="label">Experience Level</label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {['Student', 'Fresh Graduate', '1-2 Years', '3+ Years'].map(exp => (
                    <label key={exp} className="cursor-pointer">
                      <input type="radio" value={exp} {...register('experience')} className="peer hidden" />
                      <div className="px-4 py-3 border border-border rounded-xl text-center peer-checked:bg-green/20 peer-checked:border-green peer-checked:text-green transition-colors text-sm font-medium">
                        {exp}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Your Top Skills (comma separated)</label>
                <input {...register('skills')} className="input-field" placeholder="e.g. React, UI Design, Marketing" />
                {errors.skills && <p className="text-red-400 text-sm mt-1">{errors.skills.message}</p>}
                <p className="text-xs text-muted mt-1">These heavily influence your score and AI blueprint.</p>
              </div>

              <div>
                <label className="label">Areas of Interest (Optional)</label>
                <input {...register('interests')} className="input-field" placeholder="e.g. AI, Web3, Startups" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 flex-1 animate-fade-in">
              <h2 className="text-xl font-bold border-b border-border pb-2">Career Goals</h2>
              
              <div>
                <label className="label">What is your primary career goal?</label>
                <textarea 
                  {...register('career_goal')} 
                  className="input-field h-40" 
                  placeholder="I want to become a Senior Frontend Developer at a top tech company..." 
                />
                {errors.career_goal && <p className="text-red-400 text-sm mt-1">{errors.career_goal.message}</p>}
                <p className="text-xs text-muted mt-2">Radar AI will use this goal to generate a personalized roadmap for you.</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-border">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="btn-ghost flex items-center gap-2">
                <ArrowLeft size={18} /> Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <button type="button" onClick={handleNext} className="btn-primary flex items-center gap-2">
                Continue <ArrowRight size={18} />
              </button>
            ) : (
              <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 bg-gradient-to-r from-green to-blue-accent border-none text-[#07070C]">
                {loading ? 'Finalizing...' : 'Complete Setup'} <ArrowRight size={18} />
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  )
}