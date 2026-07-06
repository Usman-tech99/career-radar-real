import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/layout/AdminSidebar'
import toast from 'react-hot-toast'
import { Save, Plus, Trash2 } from 'lucide-react'

export default function ManageAbout() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    story_heading: 'Learn More',
    story_text: '',
    founded_date: '',
    contact_email: '',
    contact_whatsapp: '',
    community_link: '',
    tagline: '',
    founder_message: '',
    mission_text: '',
    core_values: [{ title: '', desc: '' }],
    what_we_do: '',
    who_can_join: '',
  })

  useEffect(() => {
    fetchAbout()
  }, [])

  async function fetchAbout() {
    const { data: aboutData, error } = await supabase.from('about_page').select('*').eq('id', 1).single()
    if (error) toast.error('Failed to load about data')
    else if (aboutData) setData(aboutData)
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('about_page').update(data).eq('id', 1)
    if (error) toast.error('Failed to save about data')
    else toast.success('About page updated successfully')
    setSaving(false)
  }

  if (loading) return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Manage About Page</h1>
            <p className="text-muted text-sm mt-1">Edit the Story, Contact info, and Taglines for the public About page.</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={20} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="space-y-8">
          <div className="glass-card space-y-4">
            <h2 className="text-xl font-bold mb-4">Learn More Section</h2>
            
            <div>
              <label className="label">Tagline (Short punchy phrase)</label>
              <input 
                value={data.tagline} 
                onChange={e => setData({...data, tagline: e.target.value})} 
                className="input-field"
                placeholder="e.g. Navigating Careers with AI"
              />
            </div>

            <div>
              <label className="label">Founder Message</label>
              <textarea 
                value={data.founder_message} 
                onChange={e => setData({...data, founder_message: e.target.value})} 
                className="input-field h-32"
                placeholder="A Message from the Founder..."
              />
            </div>
          </div>

          <div className="glass-card space-y-4">
            <h2 className="text-xl font-bold mb-4">Our Mission</h2>
            <div>
              <label className="label">Mission Text</label>
              <textarea 
                value={data.mission_text} 
                onChange={e => setData({...data, mission_text: e.target.value})} 
                className="input-field h-32"
                placeholder="Our mission is to..."
              />
            </div>
          </div>

          <div className="glass-card space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold mb-4">Core Values</h2>
              <button onClick={() => setData({ ...data, core_values: [...data.core_values, { title: '', desc: '' }] })} className="btn-ghost text-sm flex items-center gap-1"><Plus size={14} /> Add Value</button>
            </div>
            {data.core_values.map((v, i) => (
              <div key={i} className="flex items-end gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                <div className="flex-1">
                  <label className="label">Title</label>
                  <input value={v.title} onChange={e => { const cv = [...data.core_values]; cv[i] = { ...cv[i], title: e.target.value }; setData({ ...data, core_values: cv }) }} className="input-field" placeholder="e.g. Integrity" />
                </div>
                <div className="flex-[2]">
                  <label className="label">Description</label>
                  <input value={v.desc} onChange={e => { const cv = [...data.core_values]; cv[i] = { ...cv[i], desc: e.target.value }; setData({ ...data, core_values: cv }) }} className="input-field" placeholder="What this value means..." />
                </div>
                <button onClick={() => setData({ ...data, core_values: data.core_values.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>

          <div className="glass-card space-y-4">
            <h2 className="text-xl font-bold mb-4">What We Do</h2>
            <div>
              <label className="label">Description</label>
              <textarea 
                value={data.what_we_do} 
                onChange={e => setData({...data, what_we_do: e.target.value})} 
                className="input-field h-32"
                placeholder="Describe what Career Radar does..."
              />
            </div>
          </div>

          <div className="glass-card space-y-4">
            <h2 className="text-xl font-bold mb-4">Who Can Join?</h2>
            <div>
              <label className="label">Description</label>
              <textarea 
                value={data.who_can_join} 
                onChange={e => setData({...data, who_can_join: e.target.value})} 
                className="input-field h-32"
                placeholder="Describe who can join Career Radar..."
              />
            </div>
          </div>

          <div className="glass-card space-y-4">
            <h2 className="text-xl font-bold mb-4">Contact & Metadata</h2>
            
            <div>
              <label className="label">Founded Date</label>
              <input 
                value={data.founded_date} 
                onChange={e => setData({...data, founded_date: e.target.value})} 
                className="input-field"
                placeholder="e.g. August 2024"
              />
            </div>

            <div>
              <label className="label">Contact Email</label>
              <input 
                type="email"
                value={data.contact_email} 
                onChange={e => setData({...data, contact_email: e.target.value})} 
                className="input-field"
                placeholder="hello@careerradar.com"
              />
            </div>

            <div>
              <label className="label">Contact WhatsApp</label>
              <input 
                value={data.contact_whatsapp} 
                onChange={e => setData({...data, contact_whatsapp: e.target.value})} 
                className="input-field"
                placeholder="+92 300 1234567"
              />
            </div>

            <div>
              <label className="label">Main Community Link (Discord/WhatsApp Group)</label>
              <input 
                value={data.community_link} 
                onChange={e => setData({...data, community_link: e.target.value})} 
                className="input-field"
                placeholder="https://chat.whatsapp.com/..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
