import { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { BlurFade } from './magicui/blur-fade'
import { BorderBeam } from './magicui/border-beam'
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react'


const DEPARTMENTS = [
  'Community Management', 'Content Writing', 'Opportunity Research', 'Graphic Design',
  'Video Editing', 'Social Media Marketing', 'AI & Automation', 'Website Development',
  'Partnerships & Outreach', 'HR & Volunteer Management', 'Operations', 'Event Management',
]

const SKILLS = [
  'Canva', 'Photoshop', 'Figma', 'CapCut', 'Premiere Pro', 'Microsoft Office',
  'Google Workspace', 'ChatGPT', 'Gemini', 'Claude', 'Notion', 'WordPress',
  'HTML/CSS', 'JavaScript', 'Python', 'Social Media Marketing', 'Content Writing',
  'Public Speaking', 'Event Management', 'Research', 'Project Management',
]

const WHY_CARDS = [
  { icon: '🌍', title: 'Make an Impact', desc: 'Help thousands of students discover life-changing opportunities.' },
  { icon: '🚀', title: 'Build Experience', desc: 'Work on real projects in marketing, research, design, AI, operations, and community management.' },
  { icon: '🤝', title: 'Network', desc: 'Connect with ambitious students, professionals, and industry leaders.' },
  { icon: '📜', title: 'Certificate & Recognition', desc: 'Receive certificates, recommendation letters (performance-based), LinkedIn endorsements, and public recognition.' },
  { icon: '💼', title: 'Career Growth', desc: 'Develop leadership, communication, project management, and digital skills.' },
]

function Input({ label, required, value, onChange, type = 'text', placeholder, textarea, className }) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return (
    <div className={className}>
      <label htmlFor={id} className="label">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      {textarea ? (
        <textarea id={id} value={value} onChange={e => onChange(e.target.value)} className="input-field h-28" placeholder={placeholder} />
      ) : (
        <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} className="input-field" placeholder={placeholder} />
      )}
    </div>
  )
}

function RadioGroup({ label, options, value, onChange }) {
  return (
    <div>
      <p className="label mb-2">{label}</p>
      <div className="flex flex-wrap gap-3">
        {options.map(opt => (
          <button key={opt} type="button" onClick={() => onChange(opt)} className={`px-4 py-2 text-sm rounded-lg border transition-colors ${value === opt ? 'bg-green/10 text-green border-green/40' : 'bg-white/[0.02] text-muted border-border hover:border-white/20'}`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function PillGroup({ label, options, selected, onToggle }) {
  return (
    <div>
      <p className="label mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button key={opt} type="button" onClick={() => onToggle(opt)} className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${selected.includes(opt) ? 'bg-green/10 text-green border-green/40' : 'bg-white/[0.02] text-muted border-border hover:border-white/20'}`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function VolunteerForm() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    fullName: '', preferredName: '', email: '', phone: '', country: '', city: '',
    university: '', degree: '', currentYear: '', linkedin: '', portfolio: '', cvUrl: '',
    departments: [], reason: '', about: '',
    skills: [], otherSkills: '', volunteeredBefore: '', prevOrganizations: '', prevRoles: '', prevDuration: '',
    hoursPerWeek: '', preferredTime: '', preferredChannel: '',
    biggestStrength: '', skillToDevelop: '', proudProject: '', heardFrom: '',
    agreementVolunteer: false, agreementHours: false, agreementConduct: false, agreementAccurate: false,
  })

  function set(key, value) { setForm(prev => ({ ...prev, [key]: value })) }

  function toggleDept(dept) {
    setForm(prev => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter(d => d !== dept)
        : [...prev.departments, dept]
    }))
  }

  function toggleSkill(skill) {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.fullName || !form.email || !form.phone || !form.country) {
      return toast.error('Please fill in all required fields')
    }
    if (form.departments.length === 0) return toast.error('Select at least one department')
    if (!form.agreementVolunteer || !form.agreementHours || !form.agreementConduct || !form.agreementAccurate) {
      return toast.error('Please agree to all terms')
    }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('volunteers').insert({
        full_name: form.fullName,
        preferred_name: form.preferredName,
        email: form.email,
        phone: form.phone,
        country: form.country,
        city: form.city,
        university: form.university,
        degree: form.degree,
        current_year: form.currentYear,
        linkedin: form.linkedin,
        portfolio: form.portfolio,
        cv_url: form.cvUrl,
        departments: form.departments,
        reason: form.reason,
        about: form.about,
        skills: form.skills,
        other_skills: form.otherSkills,
        volunteered_before: form.volunteeredBefore === 'yes',
        prev_organizations: form.prevOrganizations,
        prev_roles: form.prevRoles,
        prev_duration: form.prevDuration,
        hours_per_week: form.hoursPerWeek,
        preferred_time: form.preferredTime,
        preferred_channel: form.preferredChannel,
        biggest_strength: form.biggestStrength,
        skill_to_develop: form.skillToDevelop,
        proud_project: form.proudProject,
        heard_from: form.heardFrom,
        agreement_volunteer: form.agreementVolunteer,
        agreement_hours: form.agreementHours,
        agreement_conduct: form.agreementConduct,
        agreement_accurate: form.agreementAccurate,
      })
      if (error) throw error
      // Send email notification
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-volunteer-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
          body: JSON.stringify({ full_name: form.fullName, email: form.email, phone: form.phone, country: form.country, departments: form.departments })
        })
      } catch (_) { /* email notification is optional */ }
      setSubmitted(true)
    } catch (err) {
      toast.error(err.message || 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <BlurFade delay={0.2} offset={15} blur="5px" className="w-full max-w-2xl mx-auto mt-28 mb-8">
        <div className="glass-card p-12 md:p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green/10 flex items-center justify-center">
            <CheckCircle size={32} className="text-green" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Application Submitted!</h2>
          <p className="text-muted text-lg mb-4">Thank you for applying to Career Radar.</p>
          <p className="text-muted/80 leading-relaxed">
            Our team will review your application and contact shortlisted candidates via email or WhatsApp. If selected, you'll receive onboarding instructions and be invited to join our volunteer workspace.
          </p>
          <p className="text-muted/60 mt-6 text-sm">We appreciate your willingness to contribute to our mission of helping students build better careers.</p>
        </div>
      </BlurFade>
    )
  }

  const inputClass = ""

  return (
    <div className="w-full max-w-5xl mx-auto mt-28 mb-8 space-y-8">
      {/* Hero */}
      <BlurFade delay={0.1} offset={15} blur="5px">
        <div className="glass-card p-10 md:p-16 text-center relative overflow-hidden">
          <BorderBeam size={200} duration={12} colorFrom="#10B981" colorTo="#60A5FA" borderWidth={1} />
          <h1 className="text-4xl md:text-5xl font-bold font-sora text-white mb-4">Become a Career Radar Volunteer</h1>
          <h2 className="text-2xl md:text-3xl font-bold text-green mb-4">Help Shape the Future of Students Worldwide.</h2>
          <p className="text-muted text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
            Career Radar is building an AI-powered global career ecosystem that helps students discover opportunities, develop skills, and build successful careers.
          </p>
          <p className="text-muted text-base md:text-lg leading-relaxed max-w-3xl mx-auto mt-4">
            As a volunteer, you'll work with passionate students and professionals, gain real-world experience, build your portfolio, expand your network, and make a meaningful impact.
          </p>
          <p className="text-green font-bold text-xl mt-6">No salary. Real experience. Real leadership. Real impact.</p>
          <p className="text-muted mt-2">Apply if you're ready to learn, contribute, and grow with us.</p>
        </div>
      </BlurFade>

      {/* Why Join */}
      <BlurFade delay={0.2} offset={15} blur="5px">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">Why Join Career Radar?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_CARDS.map((card, i) => (
            <div key={i} className="glass-card p-6 text-center">
              <span className="text-4xl block mb-4">{card.icon}</span>
              <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
              <p className="text-sm text-muted">{card.desc}</p>
            </div>
          ))}
        </div>
      </BlurFade>

      {/* Who Can Apply */}
      <BlurFade delay={0.3} offset={15} blur="5px">
        <div className="glass-card p-8 md:p-10 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Who Can Apply?</h2>
          <p className="text-muted mb-4">Anyone who is:</p>
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            {['University student', 'Fresh graduate', 'Freelancer', 'Professional', 'Passionate learner'].map(who => (
              <span key={who} className="px-4 py-2 bg-white/[0.04] border border-border rounded-full text-sm text-white">{who}</span>
            ))}
          </div>
          <p className="text-muted/80 text-sm">No prior experience is required for many roles. We value commitment, curiosity, and willingness to learn.</p>
        </div>
      </BlurFade>

      {/* Departments */}
      <BlurFade delay={0.4} offset={15} blur="5px">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">Available Volunteer Departments</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEPARTMENTS.map(dept => (
            <div key={dept} className={`glass-card p-5 text-center border transition-colors ${form.departments.includes(dept) ? 'border-green/40 bg-green/5' : ''}`}>
              <h3 className="font-bold text-white text-base">{dept}</h3>
            </div>
          ))}
        </div>
      </BlurFade>

      {/* Expectations */}
      <BlurFade delay={0.5} offset={15} blur="5px">
        <div className="glass-card p-8 md:p-10">
          <h2 className="text-2xl font-bold text-white mb-4">Volunteer Expectations</h2>
          <p className="text-muted mb-4">Applicants should be able to:</p>
          <ul className="space-y-2">
            {[
              'Contribute around 4–8 hours per week',
              'Communicate professionally',
              'Meet agreed deadlines',
              'Work collaboratively',
              'Respect community values',
              'Be proactive and willing to learn',
            ].map(item => (
              <li key={item} className="flex items-center gap-2 text-muted"><CheckCircle size={14} className="text-green shrink-0" />{item}</li>
            ))}
          </ul>
        </div>
      </BlurFade>

      {/* Form */}
      <BlurFade delay={0.6} offset={15} blur="5px">
        <div className="glass-card p-8 md:p-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">Volunteer Application Form</h2>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-green border-b border-green/20 pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Full Name" required value={form.fullName} onChange={v => set('fullName', v)} placeholder="Muhammad Usman" />
                <Input label="Preferred Name" value={form.preferredName} onChange={v => set('preferredName', v)} placeholder="Usman" />
                <Input label="Email Address" required type="email" value={form.email} onChange={v => set('email', v)} placeholder="you@example.com" />
                <Input label="Phone Number (WhatsApp)" required value={form.phone} onChange={v => set('phone', v)} placeholder="+92 300 1234567" />
                <Input label="Country" required value={form.country} onChange={v => set('country', v)} placeholder="Pakistan" />
                <Input label="City" value={form.city} onChange={v => set('city', v)} placeholder="Lahore" />
                <Input label="University / Organization" value={form.university} onChange={v => set('university', v)} placeholder="University of Engineering and Technology" />
                <Input label="Degree / Program" value={form.degree} onChange={v => set('degree', v)} placeholder="BS Computer Science" />
                <Input label="Current Year / Semester" value={form.currentYear} onChange={v => set('currentYear', v)} placeholder="3rd Year / 6th Semester" />
                <Input label="LinkedIn Profile" value={form.linkedin} onChange={v => set('linkedin', v)} placeholder="https://linkedin.com/in/..." />
                <Input label="Portfolio / Website (optional)" value={form.portfolio} onChange={v => set('portfolio', v)} placeholder="https://your-site.com" />
                <Input label="CV/Resume Upload (optional but recommended)" value={form.cvUrl} onChange={v => set('cvUrl', v)} placeholder="Google Drive or Dropbox link" />
              </div>
            </div>

            {/* Volunteer Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-green border-b border-green/20 pb-2">Volunteer Information</h3>
              <PillGroup label="Which department would you like to join? *" options={DEPARTMENTS} selected={form.departments} onToggle={toggleDept} />
              <Input label="Why do you want to join Career Radar?" textarea value={form.reason} onChange={v => set('reason', v)} placeholder="Tell us what drives you..." />
              <Input label="Tell us about yourself in 100–200 words" textarea value={form.about} onChange={v => set('about', v)} placeholder="Your background, interests, and what you bring..." />
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-green border-b border-green/20 pb-2">Skills</h3>
              <PillGroup label="Select your skills" options={SKILLS} selected={form.skills} onToggle={toggleSkill} />
              <Input label="Other skills not listed above" value={form.otherSkills} onChange={v => set('otherSkills', v)} placeholder="e.g. SEO, Data Analysis, Copywriting..." />
            </div>

            {/* Experience */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-green border-b border-green/20 pb-2">Experience</h3>
              <RadioGroup label="Have you volunteered before?" options={['Yes', 'No']} value={form.volunteeredBefore} onChange={v => set('volunteeredBefore', v)} />
              {form.volunteeredBefore === 'Yes' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input label="Previous organization(s)" value={form.prevOrganizations} onChange={v => set('prevOrganizations', v)} />
                  <Input label="Role(s)" value={form.prevRoles} onChange={v => set('prevRoles', v)} />
                  <Input label="Duration" value={form.prevDuration} onChange={v => set('prevDuration', v)} placeholder="6 months" />
                </div>
              )}
            </div>

            {/* Availability & Communication */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-green border-b border-green/20 pb-2">Availability</h3>
              <RadioGroup label="Hours available each week" options={['2–4', '4–6', '6–8', '8+']} value={form.hoursPerWeek} onChange={v => set('hoursPerWeek', v)} />
              <RadioGroup label="Preferred working time" options={['Morning', 'Afternoon', 'Evening', 'Flexible']} value={form.preferredTime} onChange={v => set('preferredTime', v)} />
              <RadioGroup label="Preferred communication channel" options={['WhatsApp', 'Discord', 'Slack', 'Email']} value={form.preferredChannel} onChange={v => set('preferredChannel', v)} />
            </div>

            {/* Short Questions */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-green border-b border-green/20 pb-2">Short Questions</h3>
              <Input label="What is your biggest strength?" textarea value={form.biggestStrength} onChange={v => set('biggestStrength', v)} />
              <Input label="What skill do you want to develop by volunteering?" textarea value={form.skillToDevelop} onChange={v => set('skillToDevelop', v)} />
              <Input label="Describe one project you're proud of" textarea value={form.proudProject} onChange={v => set('proudProject', v)} />
              <Input label="How did you hear about Career Radar?" textarea value={form.heardFrom} onChange={v => set('heardFrom', v)} />
            </div>

            {/* Agreement */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-green border-b border-green/20 pb-2">Agreement</h3>
              <div className="space-y-3">
                {[
                  { key: 'agreementVolunteer', label: 'I understand this is currently a volunteer position.' },
                  { key: 'agreementHours', label: 'I can commit at least 4 hours per week.' },
                  { key: 'agreementConduct', label: 'I agree to follow Career Radar\'s code of conduct.' },
                  { key: 'agreementAccurate', label: 'The information provided is accurate.' },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form[item.key]} onChange={e => set(item.key, e.target.checked)} className="w-4 h-4 rounded border-border bg-white/[0.04] accent-green" />
                    <span className="text-sm text-muted">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="text-center pt-4">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Ready to Make an Impact?</h3>
              <p className="text-muted mb-6">Join hundreds of volunteers and contributors who are helping build the next generation of global talent.</p>
              <button type="submit" disabled={submitting} className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
                  {submitting ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                {submitting ? 'Submitting...' : 'Apply as a Volunteer'}
              </button>
            </div>
          </form>
        </div>
      </BlurFade>
    </div>
  )
}
