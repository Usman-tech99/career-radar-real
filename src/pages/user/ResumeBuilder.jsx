import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { BlurFade } from '../../components/magicui/blur-fade'
import { BorderBeam } from '../../components/magicui/border-beam'
import { FileText, Plus, Trash2, Save, Download, Sparkles, ChevronRight, Briefcase, GraduationCap, Code, Award, Globe, Mail, Phone, MapPin, ExternalLink, GripVertical, X, User, Camera } from 'lucide-react'

const EMPTY_EDUCATION = { institution: '', degree: '', field: '', startYear: '', endYear: '', gpa: '' }
const EMPTY_EXPERIENCE = { company: '', title: '', location: '', startDate: '', endDate: '', current: false, description: '' }
const EMPTY_PROJECT = { name: '', description: '', technologies: '', link: '' }
const EMPTY_CERTIFICATION = { name: '', issuer: '', date: '', link: '' }

function Input({ label, value, onChange, placeholder, type = 'text', className = '' }) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-muted mb-1.5 block">{label}</label>
      {type === 'textarea' ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full bg-white/[0.04] border border-border rounded-xl px-4 py-3 text-white text-sm placeholder:text-muted/50 focus:outline-none focus:border-green/50 transition-colors resize-none h-24" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full bg-white/[0.04] border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-muted/50 focus:outline-none focus:border-green/50 transition-colors" />
      )}
    </div>
  )
}

function SectionCard({ title, icon: Icon, children, onAdd, addLabel }) {
  return (
    <BlurFade delay={0.1} offset={8} blur="3px">
      <div className="glass-card p-6 rounded-2xl relative">
        <BorderBeam size={50} duration={10} colorFrom="#10B981" colorTo="#3B82F6" borderWidth={1} />
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white flex items-center gap-2"><Icon size={18} className="text-green" /> {title}</h3>
          {onAdd && (
            <button onClick={onAdd} className="text-xs flex items-center gap-1 text-green hover:text-green/80 transition-colors font-medium">
              <Plus size={14} /> {addLabel || 'Add'}
            </button>
          )}
        </div>
        {children}
      </div>
    </BlurFade>
  )
}

export default function ResumeBuilder() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('edit')

  const [personal, setPersonal] = useState({ fullName: '', email: '', phone: '', location: '', title: '', linkedin: '', portfolio: '', bio: '', avatarUrl: '' })
  const [education, setEducation] = useState([{ ...EMPTY_EDUCATION }])
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [experience, setExperience] = useState([])
  const [projects, setProjects] = useState([])
  const [certifications, setCertifications] = useState([])

  useEffect(() => {
    if (user) fetchExistingData()
  }, [user])

  async function fetchExistingData() {
    try {
      const [onboardRes, profileRes, publicRes, resumeRes] = await Promise.all([
        supabase.from('onboarding_data').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('public_users').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('resumes').select('data').eq('user_id', user.id).maybeSingle(),
      ])

      // If saved resume exists, load it then merge latest avatar
      if (resumeRes?.data?.data) {
        const d = resumeRes.data.data
        if (d.personal) setPersonal({ ...d.personal, avatarUrl: profileRes?.data?.avatar_url || publicRes?.data?.avatar_url || d.personal.avatarUrl || '' })
        if (d.education?.length) setEducation(d.education)
        if (d.skills?.length) setSkills(d.skills)
        if (d.experience?.length) setExperience(d.experience)
        if (d.projects?.length) setProjects(d.projects)
        if (d.certifications?.length) setCertifications(d.certifications)
        return
      }

      // Pre-fill from existing data
      setPersonal({
        fullName: publicRes?.data?.full_name || profileRes?.data?.full_name || '',
        email: publicRes?.data?.email || user?.email || '',
        phone: '',
        location: onboardRes?.data?.city ? `${onboardRes.data.city}, ${onboardRes.data.country || ''}` : publicRes?.data?.country || '',
        title: profileRes?.data?.role_title || '',
        linkedin: profileRes?.data?.linkedin_url || '',
        portfolio: '',
        bio: profileRes?.data?.bio || '',
        avatarUrl: profileRes?.data?.avatar_url || publicRes?.data?.avatar_url || '',
      })
      if (onboardRes?.data?.skills?.length) setSkills(onboardRes.data.skills)
      if (onboardRes?.data?.degree) setEducation([{ ...EMPTY_EDUCATION, degree: onboardRes.data.degree, institution: onboardRes.data.study_year || '' }])
    } catch (err) {
      console.error('Resume: fetch error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  function handlePersonalChange(field, value) {
    setPersonal(prev => ({ ...prev, [field]: value }))
  }

  function addEducation() { setEducation(prev => [...prev, { ...EMPTY_EDUCATION }]) }
  function removeEducation(i) { setEducation(prev => prev.filter((_, idx) => idx !== i)) }
  function updateEducation(i, field, value) {
    setEducation(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  function addSkill() {
    const s = newSkill.trim()
    if (s && !skills.includes(s)) { setSkills(prev => [...prev, s]); setNewSkill('') }
  }
  function removeSkill(s) { setSkills(prev => prev.filter(item => item !== s)) }

  function addExperience() { setExperience(prev => [...prev, { ...EMPTY_EXPERIENCE }]) }
  function removeExperience(i) { setExperience(prev => prev.filter((_, idx) => idx !== i)) }
  function updateExperience(i, field, value) {
    setExperience(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  function addProject() { setProjects(prev => [...prev, { ...EMPTY_PROJECT }]) }
  function removeProject(i) { setProjects(prev => prev.filter((_, idx) => idx !== i)) }
  function updateProject(i, field, value) {
    setProjects(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  function addCertification() { setCertifications(prev => [...prev, { ...EMPTY_CERTIFICATION }]) }
  function removeCertification(i) { setCertifications(prev => prev.filter((_, idx) => idx !== i)) }
  function updateCertification(i, field, value) {
    setCertifications(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  async function handleSave() {
    setSaving(true)
    const data = { personal, education, skills, experience, projects, certifications }
    const { error } = await supabase.from('resumes').upsert({ user_id: user.id, data }, { onConflict: 'user_id' })
    if (error) { toast.error('Failed to save resume'); console.error('Resume: save error:', error.message) }
    else toast.success('Resume saved!')
    setSaving(false)
  }

  function handlePrint() {
    setActiveTab('preview')
    const originalTitle = document.title
    document.title = ''
    setTimeout(() => { window.print(); document.title = originalTitle }, 800)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#07070C]">
        <div className="w-64 h-screen bg-[#0A0A12]/90 backdrop-blur-xl border-r border-white/[0.05] fixed left-0 top-0 pt-20 z-20" />
        <div className="flex-1 ml-64 p-6 md:p-10">
          <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
            <div className="h-8 w-48 rounded bg-white/[0.06]" />
            <div className="h-64 w-full rounded-2xl bg-white/[0.04]" />
            <div className="h-64 w-full rounded-2xl bg-white/[0.04]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10 print:p-0">
      <div className="max-w-5xl mx-auto">
          {/* Header */}
          <BlurFade offset={8} blur="3px" className="flex items-center justify-between mb-8 print:hidden">
            <div>
              <h1 className="text-3xl font-bold font-sora flex items-center gap-3">
                <FileText className="text-green" /> Resume Builder
              </h1>
              <p className="text-muted text-sm mt-1">Build a professional resume from your profile data.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleSave} disabled={saving}
                className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5">
                <Save size={16} /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={handlePrint}
                className="btn-ghost border border-border flex items-center gap-2 text-sm px-5 py-2.5">
                <Download size={16} /> Export PDF
              </button>
            </div>
          </BlurFade>

          {/* Tab Switcher (edit / preview) */}
          <div className="flex gap-1 bg-white/[0.04] rounded-xl p-1 w-fit mb-8 print:hidden">
            {['edit', 'preview'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                  activeTab === tab ? 'bg-green text-[#07070C]' : 'text-muted hover:text-white'
                }`}>
                {tab === 'edit' ? <><FileText size={14} className="inline mr-1.5" />Edit</> : <><Sparkles size={14} className="inline mr-1.5" />Preview</>}
              </button>
            ))}
          </div>

          {/* Edit View */}
          {activeTab === 'edit' && (
            <div className="space-y-6">
              {/* Personal Info */}
              <SectionCard title="Personal Info" icon={User}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Full Name" value={personal.fullName} onChange={v => handlePersonalChange('fullName', v)} placeholder="Muhammad Usman" />
                  <Input label="Professional Title" value={personal.title} onChange={v => handlePersonalChange('title', v)} placeholder="Software Engineer" />
                  <Input label="Email" value={personal.email} onChange={v => handlePersonalChange('email', v)} placeholder="john@email.com" />
                  <Input label="Phone" value={personal.phone} onChange={v => handlePersonalChange('phone', v)} placeholder="+92 300 1234567" />
                  <Input label="Location" value={personal.location} onChange={v => handlePersonalChange('location', v)} placeholder="Lahore, Pakistan" />
                  <Input label="LinkedIn URL" value={personal.linkedin} onChange={v => handlePersonalChange('linkedin', v)} placeholder="https://linkedin.com/in/..." />
                  <Input label="Portfolio URL" value={personal.portfolio} onChange={v => handlePersonalChange('portfolio', v)} placeholder="https://your-site.com" />
                </div>
                <Input label="Bio / Summary" value={personal.bio} onChange={v => handlePersonalChange('bio', v)} placeholder="Brief professional summary..." type="textarea" className="mt-4" />
              </SectionCard>

              {/* Education */}
              <SectionCard title="Education" icon={GraduationCap} onAdd={addEducation} addLabel="Add Education">
                {education.map((edu, i) => (
                  <div key={i} className="mb-4 pb-4 border-b border-white/[0.05] last:border-0 last:pb-0 last:mb-0 relative">
                    {education.length > 1 && (
                      <button onClick={() => removeEducation(i)} className="absolute top-0 right-0 text-red-400/50 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input label="Institution" value={edu.institution} onChange={v => updateEducation(i, 'institution', v)} placeholder="University Name" />
                      <Input label="Degree" value={edu.degree} onChange={v => updateEducation(i, 'degree', v)} placeholder="BS Computer Science" />
                      <Input label="Field of Study" value={edu.field} onChange={v => updateEducation(i, 'field', v)} placeholder="Computer Science" />
                      <Input label="GPA" value={edu.gpa} onChange={v => updateEducation(i, 'gpa', v)} placeholder="3.8 / 4.0" />
                      <Input label="Start Year" value={edu.startYear} onChange={v => updateEducation(i, 'startYear', v)} placeholder="2020" />
                      <Input label="End Year" value={edu.endYear} onChange={v => updateEducation(i, 'endYear', v)} placeholder="2024" />
                    </div>
                  </div>
                ))}
              </SectionCard>

              {/* Skills */}
              <SectionCard title="Skills" icon={Code}>
                <div className="flex flex-wrap gap-2 mb-4">
                  {skills.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-green/10 text-green text-xs font-medium px-3 py-1.5 rounded-full border border-green/20">
                      {s}
                      <button onClick={() => removeSkill(s)} className="hover:text-red-400 transition-colors"><X size={12} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newSkill} onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="Type a skill and press Enter..."
                    className="flex-1 bg-white/[0.04] border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-muted/50 focus:outline-none focus:border-green/50 transition-colors" />
                  <button onClick={addSkill} className="btn-ghost border border-border px-4 py-2 rounded-xl text-sm"><Plus size={16} /></button>
                </div>
              </SectionCard>

              {/* Work Experience */}
              <SectionCard title="Experience" icon={Briefcase} onAdd={addExperience} addLabel="Add Experience">
                {experience.map((exp, i) => (
                  <div key={i} className="mb-4 pb-4 border-b border-white/[0.05] last:border-0 last:pb-0 last:mb-0 relative">
                    {experience.length > 1 && (
                      <button onClick={() => removeExperience(i)} className="absolute top-0 right-0 text-red-400/50 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input label="Company" value={exp.company} onChange={v => updateExperience(i, 'company', v)} placeholder="Company Name" />
                      <Input label="Job Title" value={exp.title} onChange={v => updateExperience(i, 'title', v)} placeholder="Software Engineer" />
                      <Input label="Location" value={exp.location} onChange={v => updateExperience(i, 'location', v)} placeholder="Remote / Lahore" />
                      <div className="flex items-end gap-2">
                        <Input label="Start Date" value={exp.startDate} onChange={v => updateExperience(i, 'startDate', v)} placeholder="Jan 2022" className="flex-1" />
                        <Input label="End Date" value={exp.endDate} onChange={v => updateExperience(i, 'endDate', v)} placeholder="Present" className="flex-1" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 mt-3 cursor-pointer group">
                      <input type="checkbox" checked={exp.current} onChange={e => updateExperience(i, 'current', e.target.checked)}
                        className="w-4 h-4 rounded border-muted bg-white/[0.04] accent-green" />
                      <span className="text-xs text-muted group-hover:text-white transition-colors">I currently work here</span>
                    </label>
                    <Input label="Description" value={exp.description} onChange={v => updateExperience(i, 'description', v)} placeholder="Describe your responsibilities and achievements..." type="textarea" className="mt-3" />
                  </div>
                ))}
              </SectionCard>

              {/* Projects */}
              <SectionCard title="Projects" icon={Code} onAdd={addProject} addLabel="Add Project">
                {projects.map((proj, i) => (
                  <div key={i} className="mb-4 pb-4 border-b border-white/[0.05] last:border-0 last:pb-0 last:mb-0 relative">
                    {projects.length > 1 && (
                      <button onClick={() => removeProject(i)} className="absolute top-0 right-0 text-red-400/50 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input label="Project Name" value={proj.name} onChange={v => updateProject(i, 'name', v)} placeholder="Project Name" />
                      <Input label="Technologies" value={proj.technologies} onChange={v => updateProject(i, 'technologies', v)} placeholder="React, Node.js, PostgreSQL" />
                      <Input label="Link" value={proj.link} onChange={v => updateProject(i, 'link', v)} placeholder="https://github.com/..." className="md:col-span-2" />
                    </div>
                    <Input label="Description" value={proj.description} onChange={v => updateProject(i, 'description', v)} placeholder="Brief description..." type="textarea" className="mt-3" />
                  </div>
                ))}
              </SectionCard>

              {/* Certifications */}
              <SectionCard title="Certifications" icon={Award} onAdd={addCertification} addLabel="Add Certification">
                {certifications.map((cert, i) => (
                  <div key={i} className="mb-4 pb-4 border-b border-white/[0.05] last:border-0 last:pb-0 last:mb-0 relative">
                    {certifications.length > 1 && (
                      <button onClick={() => removeCertification(i)} className="absolute top-0 right-0 text-red-400/50 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input label="Certification Name" value={cert.name} onChange={v => updateCertification(i, 'name', v)} placeholder="AWS Certified Developer" />
                      <Input label="Issuer" value={cert.issuer} onChange={v => updateCertification(i, 'issuer', v)} placeholder="Amazon Web Services" />
                      <Input label="Date" value={cert.date} onChange={v => updateCertification(i, 'date', v)} placeholder="2024" />
                      <Input label="Link" value={cert.link} onChange={v => updateCertification(i, 'link', v)} placeholder="https://credential..." />
                    </div>
                  </div>
                ))}
              </SectionCard>
            </div>
          )}

          {/* Preview View */}
          {activeTab === 'preview' && (
            <div className="print:block">
              <div className="bg-white text-black rounded-2xl print:rounded-none shadow-2xl overflow-hidden">
                {/* Europass-style CV */}
                <div className="flex flex-col md:flex-row print:flex-row min-h-[842px]">
                  {/* Sidebar — personal info, skills, languages */}
                  <div className="md:w-[35%] print:w-[35%] bg-[#059669] print:bg-[#059669] text-white p-6 md:p-8 print:p-6 flex flex-col gap-5">
                    {/* Name & Title */}
                    <div className="text-center">
                      {personal.avatarUrl ? (
                        <img src={personal.avatarUrl} alt={personal.fullName} className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-2 border-white/30" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-white/20 mx-auto mb-3 flex items-center justify-center text-2xl font-bold">
                          {personal.fullName ? personal.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
                        </div>
                      )}
                      <h1 className="text-xl font-bold leading-tight">{personal.fullName || 'Your Name'}</h1>
                      {personal.title && <p className="text-sm text-white/70 mt-1">{personal.title}</p>}
                    </div>

                    {/* Contact */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Contact</h3>
                      <div className="space-y-2 text-sm">
                        {personal.email && <p className="flex items-center gap-2 text-white/80"><Mail size={14} className="shrink-0" /> {personal.email}</p>}
                        {personal.phone && <p className="flex items-center gap-2 text-white/80"><Phone size={14} className="shrink-0" /> {personal.phone}</p>}
                        {personal.location && <p className="flex items-center gap-2 text-white/80"><MapPin size={14} className="shrink-0" /> {personal.location}</p>}
                        {personal.linkedin && <p className="flex items-center gap-2 text-white/80 truncate"><ExternalLink size={14} className="shrink-0" /> {personal.linkedin.replace('https://', '')}</p>}
                        {personal.portfolio && <p className="flex items-center gap-2 text-white/80 truncate"><Globe size={14} className="shrink-0" /> {personal.portfolio.replace('https://', '')}</p>}
                      </div>
                    </div>

                    {/* Skills */}
                    {skills.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Skills</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {skills.map((s, i) => (
                            <span key={i} className="text-xs bg-white/15 text-white/90 px-2.5 py-1 rounded">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {personal.bio && (
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">About</h3>
                        <p className="text-xs text-white/80 leading-relaxed">{personal.bio}</p>
                      </div>
                    )}
                  </div>

                  {/* Main Content — experience, education, projects, certifications */}
                  <div className="md:w-[65%] print:w-[65%] p-6 md:p-8 print:p-6 space-y-6">
                    {/* Experience */}
                    {experience.filter(e => e.title || e.company).length > 0 && (
                      <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-[#059669] border-b-2 border-[#059669] pb-1 mb-3">Work Experience</h2>
                        <div className="space-y-4">
                          {experience.filter(e => e.title || e.company).map((exp, i) => (
                            <div key={i}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-bold text-gray-900 text-sm">{exp.title}</h3>
                                  <p className="text-xs text-gray-600">{exp.company}{exp.location ? ` | ${exp.location}` : ''}</p>
                                </div>
                                <p className="text-xs text-gray-500 shrink-0 ml-4">{exp.startDate} — {exp.current ? 'Present' : exp.endDate}</p>
                              </div>
                              {exp.description && <p className="text-xs text-gray-700 mt-1 leading-relaxed">{exp.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {education.filter(e => e.institution || e.degree).length > 0 && (
                      <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-[#059669] border-b-2 border-[#059669] pb-1 mb-3">Education</h2>
                        <div className="space-y-3">
                          {education.filter(e => e.institution || e.degree).map((edu, i) => (
                            <div key={i} className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold text-gray-900 text-sm">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</h3>
                                <p className="text-xs text-gray-600">{edu.institution}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</p>
                              </div>
                              <p className="text-xs text-gray-500 shrink-0 ml-4">{edu.startYear} — {edu.endYear || 'Present'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {projects.filter(p => p.name).length > 0 && (
                      <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-[#059669] border-b-2 border-[#059669] pb-1 mb-3">Projects</h2>
                        <div className="space-y-3">
                          {projects.filter(p => p.name).map((proj, i) => (
                            <div key={i}>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900 text-sm">{proj.name}</h3>
                                {proj.link && <a href={proj.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline"><ExternalLink size={12} /></a>}
                              </div>
                              {proj.technologies && <p className="text-xs text-gray-500">{proj.technologies}</p>}
                              {proj.description && <p className="text-xs text-gray-700 mt-1">{proj.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    {certifications.filter(c => c.name).length > 0 && (
                      <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-[#059669] border-b-2 border-[#059669] pb-1 mb-3">Certifications</h2>
                        <div className="space-y-2">
                          {certifications.filter(c => c.name).map((cert, i) => (
                            <div key={i} className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold text-gray-900 text-sm">{cert.name}</h3>
                                {cert.issuer && <p className="text-xs text-gray-600">{cert.issuer}</p>}
                              </div>
                              <p className="text-xs text-gray-500 shrink-0 ml-4">{cert.date}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  )
}