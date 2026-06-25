import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { ArrowRight, GraduationCap, Wrench, Target, X } from 'lucide-react'

const EXPERIENCE_LEVELS = ['Student', 'Fresh Graduate', '1-2 Years', '3+ Years']

function TagInput({ label, required, tags, field, inputField, placeholder, icon: Icon, inputRef, form, updateField, addTag, removeTag, handleTagKeyDown }) {
  return (
    <div>
      <label className="label flex items-center gap-2">
        <Icon size={16} className="text-green" /> {label}{required && <span className="text-red-400">*</span>}
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 text-sm bg-green/10 text-green px-2 py-1 rounded border border-green/20">
            {tag}
            <button type="button" onClick={() => removeTag(field, tag)} className="hover:text-red-400 transition-colors">
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={form[inputField]}
          onChange={e => updateField(inputField, e.target.value)}
          onKeyDown={e => handleTagKeyDown(e, field, inputField)}
          className="input-field flex-1"
          placeholder={placeholder}
        />
        <button type="button" onClick={() => addTag(field, inputField)} className="btn-primary px-3 text-sm">
          Add
        </button>
      </div>
    </div>
  )
}

export default function Onboarding() {
  const { user, refreshOnboardingStatus } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const interestsRef = useRef(null)
  const [form, setForm] = useState({
    degree: '',
    studyYear: '',
    country: '',
    city: '',
    skillsInput: '',
    skills: [],
    interestsInput: '',
    interests: [],
    careerGoal: '',
    experience: '',
  })

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function addTag(field, inputField) {
    const value = form[inputField].trim()
    if (!value) return
    if (form[field].includes(value)) {
      toast.error('Already added')
      return
    }
    updateField(field, [...form[field], value])
    updateField(inputField, '')
    if (field === 'skills') interestsRef.current?.focus()
  }

  function removeTag(field, tag) {
    updateField(field, form[field].filter(t => t !== tag))
  }

  function handleTagKeyDown(e, field, inputField) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(field, inputField)
    }
  }

  function isStepValid() {
    if (step === 1) return form.degree.trim() && form.country.trim()
    if (step === 2) return form.skills.length > 0
    if (step === 3) return form.careerGoal.trim() && form.experience
    return true
  }

  function nextStep() {
    if (!isStepValid()) {
      toast.error('Please fill in all required fields')
      return
    }
    setStep(s => Math.min(s + 1, 3))
  }

  function prevStep() {
    setStep(s => Math.max(s - 1, 1))
  }

  async function handleSubmit() {
    if (!isStepValid()) {
      toast.error('Please fill in all required fields')
      return
    }
    if (!user) {
      toast.error('You must be logged in')
      return
    }

    setSubmitting(true)
    try {
      const fullName = user.user_metadata?.full_name || ''
      const email = user.email || ''

      const profileResult = await supabase.from('public_users').upsert({
        id: user.id,
        full_name: fullName,
        email: email,
        country: form.country,
        onboarding_complete: true,
      }, { onConflict: 'id' })

      if (profileResult.error) {
        console.error('Onboarding: public_users upsert failed:', profileResult.error.message, profileResult.error.code, profileResult.error.details)
        throw new Error(`Profile save failed: ${profileResult.error.message}`)
      }

      const dataResult = await supabase.from('onboarding_data').upsert({
        user_id: user.id,
        degree: form.degree,
        study_year: form.studyYear,
        skills: form.skills,
        country: form.country,
        city: form.city,
        career_goal: form.careerGoal,
        experience: form.experience,
        interests: form.interests,
      }, { onConflict: 'user_id' })

      if (dataResult.error) {
        console.error('Onboarding: onboarding_data upsert failed:', dataResult.error.message, dataResult.error.code, dataResult.error.details)
        throw new Error(`Data save failed: ${dataResult.error.message}`)
      }

      const refreshed = await refreshOnboardingStatus()
      if (!refreshed) {
        console.warn('Onboarding: refreshOnboardingStatus returned false, will retry on next navigation')
      }

      toast.success('Welcome aboard! Your profile is set up.')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Failed to save profile')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#07070C] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-accent/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-sora tracking-tight text-white mb-2">
            Welcome to <span className="text-green">Career Radar</span>
          </h1>
          <p className="text-muted">Let's set up your profile to unlock personalized career insights</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s <= step ? 'bg-green text-black' : 'bg-white/10 text-muted'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`w-16 h-0.5 transition-all ${s < step ? 'bg-green' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <div className="glass-card p-8">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <GraduationCap size={20} className="text-green" /> Academic Background
              </h2>
              <div>
                <label className="label">Degree / Field of Study <span className="text-red-400">*</span></label>
                <input
                  value={form.degree}
                  onChange={e => updateField('degree', e.target.value)}
                  className="input-field"
                  placeholder="e.g. BS Computer Science, MBA, Self-taught"
                />
              </div>
              <div>
                <label className="label">Study Year / Status</label>
                <input
                  value={form.studyYear}
                  onChange={e => updateField('studyYear', e.target.value)}
                  className="input-field"
                  placeholder="e.g. 3rd Year, Graduated 2023, Not applicable"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Country <span className="text-red-400">*</span></label>
                  <input
                    value={form.country}
                    onChange={e => updateField('country', e.target.value)}
                    className="input-field"
                    placeholder="e.g. Pakistan"
                  />
                </div>
                <div>
                  <label className="label">City</label>
                  <input
                    value={form.city}
                    onChange={e => updateField('city', e.target.value)}
                    className="input-field"
                    placeholder="e.g. Lahore"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Wrench size={20} className="text-green" /> Skills & Interests
              </h2>
              <TagInput
                label="Skills"
                required
                tags={form.skills}
                field="skills"
                inputField="skillsInput"
                placeholder="Type a skill and press Enter or Add"
                icon={Wrench}
                form={form}
                updateField={updateField}
                addTag={addTag}
                removeTag={removeTag}
                handleTagKeyDown={handleTagKeyDown}
              />
              <TagInput
                label="Interests"
                tags={form.interests}
                field="interests"
                inputField="interestsInput"
                placeholder="e.g. Web Development, AI, Design"
                icon={Target}
                inputRef={interestsRef}
                form={form}
                updateField={updateField}
                addTag={addTag}
                removeTag={removeTag}
                handleTagKeyDown={handleTagKeyDown}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Target size={20} className="text-green" /> Career Goals
              </h2>
              <div>
                <label className="label">Career Goal <span className="text-red-400">*</span></label>
                <textarea
                  value={form.careerGoal}
                  onChange={e => updateField('careerGoal', e.target.value)}
                  className="input-field min-h-[100px] resize-y"
                  placeholder="What do you want to achieve in your career? e.g. Become a full-stack developer at a top tech company"
                />
              </div>
              <div>
                <label className="label">Experience Level <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {EXPERIENCE_LEVELS.map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => updateField('experience', level)}
                      className={`p-3 rounded-xl border text-sm font-medium text-left transition-all ${
                        form.experience === level
                          ? 'bg-green/10 border-green text-green'
                          : 'bg-white/[0.02] border-border text-muted hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            {step > 1 ? (
              <button onClick={prevStep} className="btn-ghost border border-border px-6">
                Back
              </button>
            ) : (
              <div />
            )}
            {step < 3 ? (
              <button onClick={nextStep} disabled={!isStepValid()} className="btn-primary flex items-center gap-2 px-6">
                Next <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || !isStepValid()}
                className="btn-primary flex items-center gap-2 px-6"
              >
                {submitting ? 'Setting up...' : 'Complete Setup'} <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
