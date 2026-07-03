import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/layout/AdminSidebar'
import toast from 'react-hot-toast'
import { Save, Plus, Trash2 } from 'lucide-react'

const defaultStats = [
  { key: 'community_members', value: 1350, label: 'Community Members' },
  { key: 'countries', value: 12, label: 'Countries' },
  { key: 'whatsapp_groups', value: 9, label: 'WhatsApp Groups' },
  { key: 'career_followers', value: 1200, label: 'Career Channel Followers' },
  { key: 'scholarship_followers', value: 500, label: 'Scholarship Channel Followers' },
  { key: 'ai_followers', value: 400, label: 'AI Learning Followers' },
]

const defaultRoadmap = [
  { label: 'Verified Opportunities', status: 'live' },
  { label: 'Career Resources', status: 'live' },
  { label: 'Community Support', status: 'live' },
  { label: 'AI Learning', status: 'live' },
  { label: 'AI Career Assistant', status: 'coming' },
  { label: 'Career Readiness Score', status: 'coming' },
  { label: 'Resume Builder', status: 'coming' },
  { label: 'Personal Career Dashboard', status: 'coming' },
  { label: 'Opportunity Tracker', status: 'coming' },
  { label: 'Student Talent Profiles', status: 'coming' },
  { label: 'Employer Dashboard', status: 'coming' },
  { label: 'Premium Learning Hub', status: 'coming' },
  { label: 'Mentorship Platform', status: 'coming' },
]

const defaultExploreLinks = [
  { label: 'Scholarships', url: '/scholarships', icon: 'GraduationCap' },
  { label: 'Internships', url: '/jobs', icon: 'Briefcase' },
  { label: 'Jobs', url: '/jobs', icon: 'Briefcase' },
  { label: 'AI Resources', url: '/weekly-content', icon: 'BookOpen' },
  { label: 'Career Roadmaps', url: '/structure', icon: 'BookOpen' },
  { label: 'Blog', url: '/weekly-content', icon: 'BookOpen' },
  { label: 'WhatsApp Community', url: '/social', icon: 'MessageCircle' },
  { label: 'Volunteer Program', url: '/collaborators', icon: 'Users' },
  { label: 'Events', url: '/social', icon: 'Users' },
  { label: 'Success Stories', url: '/team', icon: 'Users' },
  { label: 'Newsletter', url: '/social', icon: 'MessageCircle' },
]

const defaultCommunityLinks = [
  { name: 'Main Career Channel', url: '', members: '1,200+' },
  { name: 'Scholarships & Internships', url: '', members: '500+' },
  { name: 'AI Learning Hub', url: '', members: '400+' },
]

export default function ManageCommunity() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    stats: defaultStats,
    roadmap_items: defaultRoadmap,
    founder_message: '',
    testimonials_heading: 'Testimonials',
    testimonials_text: 'Real success stories from our community will be featured here as members achieve scholarships, internships, jobs, and career milestones.',
    cta_heading: 'Start Your Career Journey Today',
    cta_text: 'Join thousands of students discovering opportunities, building skills, and preparing for the future with Career Radar.',
    primary_cta_text: 'Join Community',
    primary_cta_link: '/social',
    secondary_cta_text: 'Partner With Us',
    secondary_cta_link: '/collaborators',
    explore_links: defaultExploreLinks,
    community_links: defaultCommunityLinks,
  })

  useEffect(() => {
    fetchCommunity()
  }, [])

  async function fetchCommunity() {
    const { data: pageData, error } = await supabase.from('community_page').select('*').eq('id', 1).single()
    if (error && error.code !== 'PGRST116') toast.error('Failed to load community data')
    else if (pageData) setData(prev => ({ ...prev, ...pageData }))
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('community_page').upsert({ id: 1, ...data })
    if (error) toast.error('Failed to save: ' + error.message)
    else toast.success('Community page updated successfully')
    setSaving(false)
  }

  function updateStat(index, field, value) {
    const stats = [...data.stats]
    stats[index] = { ...stats[index], [field]: value }
    setData({ ...data, stats })
  }

  function addStat() {
    setData({ ...data, stats: [...data.stats, { key: '', value: 0, label: '' }] })
  }

  function removeStat(index) {
    const stats = data.stats.filter((_, i) => i !== index)
    setData({ ...data, stats })
  }

  function updateRoadmap(index, field, value) {
    const items = [...data.roadmap_items]
    items[index] = { ...items[index], [field]: value }
    setData({ ...data, roadmap_items: items })
  }

  function addRoadmapItem() {
    setData({ ...data, roadmap_items: [...data.roadmap_items, { label: '', status: 'coming' }] })
  }

  function removeRoadmapItem(index) {
    const items = data.roadmap_items.filter((_, i) => i !== index)
    setData({ ...data, roadmap_items: items })
  }

  function updateExploreLink(index, field, value) {
    const links = [...data.explore_links]
    links[index] = { ...links[index], [field]: value }
    setData({ ...data, explore_links: links })
  }

  function addExploreLink() {
    setData({ ...data, explore_links: [...data.explore_links, { label: '', url: '', icon: 'BookOpen' }] })
  }

  function removeExploreLink(index) {
    const links = data.explore_links.filter((_, i) => i !== index)
    setData({ ...data, explore_links: links })
  }

  function updateCommunityLink(index, field, value) {
    const links = [...data.community_links]
    links[index] = { ...links[index], [field]: value }
    setData({ ...data, community_links: links })
  }

  function addCommunityLink() {
    setData({ ...data, community_links: [...data.community_links, { name: '', url: '', members: '' }] })
  }

  function removeCommunityLink(index) {
    const links = data.community_links.filter((_, i) => i !== index)
    setData({ ...data, community_links: links })
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
      <div className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Manage Community Page</h1>
            <p className="text-muted text-sm mt-1">Edit the Community page content, stats, roadmap, and links.</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={20} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="space-y-8">
          {/* Stats */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Community Stats</h2>
              <button onClick={addStat} className="btn-ghost text-sm flex items-center gap-1"><Plus size={14} /> Add Stat</button>
            </div>
            {data.stats.map((stat, i) => (
              <div key={i} className="flex items-end gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                <div className="flex-1">
                  <label className="label">Key</label>
                  <input value={stat.key} onChange={e => updateStat(i, 'key', e.target.value)} className="input-field" placeholder="e.g. community_members" />
                </div>
                <div className="w-24">
                  <label className="label">Value</label>
                  <input type="number" value={stat.value} onChange={e => updateStat(i, 'value', parseInt(e.target.value) || 0)} className="input-field" />
                </div>
                <div className="flex-1">
                  <label className="label">Label</label>
                  <input value={stat.label} onChange={e => updateStat(i, 'label', e.target.value)} className="input-field" placeholder="e.g. Community Members" />
                </div>
                <button onClick={() => removeStat(i)} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>

          {/* Roadmap */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Roadmap Items</h2>
              <button onClick={addRoadmapItem} className="btn-ghost text-sm flex items-center gap-1"><Plus size={14} /> Add Item</button>
            </div>
            {data.roadmap_items.map((item, i) => (
              <div key={i} className="flex items-end gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                <div className="flex-1">
                  <label className="label">Label</label>
                  <input value={item.label} onChange={e => updateRoadmap(i, 'label', e.target.value)} className="input-field" placeholder="e.g. AI Career Assistant" />
                </div>
                <div className="w-32">
                  <label className="label">Status</label>
                  <select value={item.status} onChange={e => updateRoadmap(i, 'status', e.target.value)} className="input-field">
                    <option value="live">Live</option>
                    <option value="coming">Coming Soon</option>
                  </select>
                </div>
                <button onClick={() => removeRoadmapItem(i)} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>

          {/* Founder Message */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-xl font-bold">Founder Message</h2>
            <textarea
              value={data.founder_message}
              onChange={e => setData({ ...data, founder_message: e.target.value })}
              className="input-field h-40"
              placeholder="A Message from the Founder..."
            />
          </div>

          {/* Testimonials */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-xl font-bold">Testimonials Section</h2>
            <div>
              <label className="label">Heading</label>
              <input value={data.testimonials_heading} onChange={e => setData({ ...data, testimonials_heading: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Text</label>
              <textarea value={data.testimonials_text} onChange={e => setData({ ...data, testimonials_text: e.target.value })} className="input-field h-24" />
            </div>
          </div>

          {/* CTA */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-xl font-bold">Call to Action</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Heading</label>
                <input value={data.cta_heading} onChange={e => setData({ ...data, cta_heading: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label">Text</label>
                <input value={data.cta_text} onChange={e => setData({ ...data, cta_text: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label">Primary Button Text</label>
                <input value={data.primary_cta_text} onChange={e => setData({ ...data, primary_cta_text: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label">Primary Button Link</label>
                <input value={data.primary_cta_link} onChange={e => setData({ ...data, primary_cta_link: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label">Secondary Button Text</label>
                <input value={data.secondary_cta_text} onChange={e => setData({ ...data, secondary_cta_text: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label">Secondary Button Link</label>
                <input value={data.secondary_cta_link} onChange={e => setData({ ...data, secondary_cta_link: e.target.value })} className="input-field" />
              </div>
            </div>
          </div>

          {/* WhatsApp Community Links */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">WhatsApp Community Links</h2>
              <button onClick={addCommunityLink} className="btn-ghost text-sm flex items-center gap-1"><Plus size={14} /> Add Link</button>
            </div>
            {data.community_links.map((link, i) => (
              <div key={i} className="flex items-end gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                <div className="flex-1">
                  <label className="label">Group Name</label>
                  <input value={link.name} onChange={e => updateCommunityLink(i, 'name', e.target.value)} className="input-field" placeholder="e.g. Main Career Channel" />
                </div>
                <div className="flex-1">
                  <label className="label">Invite URL</label>
                  <input value={link.url} onChange={e => updateCommunityLink(i, 'url', e.target.value)} className="input-field" placeholder="https://chat.whatsapp.com/..." />
                </div>
                <div className="w-28">
                  <label className="label">Members</label>
                  <input value={link.members} onChange={e => updateCommunityLink(i, 'members', e.target.value)} className="input-field" placeholder="1,200+" />
                </div>
                <button onClick={() => removeCommunityLink(i)} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>

          {/* Explore Links */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Explore Section Links</h2>
              <button onClick={addExploreLink} className="btn-ghost text-sm flex items-center gap-1"><Plus size={14} /> Add Link</button>
            </div>
            {data.explore_links.map((link, i) => (
              <div key={i} className="flex items-end gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                <div className="flex-1">
                  <label className="label">Label</label>
                  <input value={link.label} onChange={e => updateExploreLink(i, 'label', e.target.value)} className="input-field" placeholder="e.g. Scholarships" />
                </div>
                <div className="flex-1">
                  <label className="label">URL</label>
                  <input value={link.url} onChange={e => updateExploreLink(i, 'url', e.target.value)} className="input-field" placeholder="/scholarships" />
                </div>
                <div className="w-36">
                  <label className="label">Icon</label>
                  <select value={link.icon} onChange={e => updateExploreLink(i, 'icon', e.target.value)} className="input-field">
                    <option value="GraduationCap">Scholarships</option>
                    <option value="Briefcase">Jobs</option>
                    <option value="BookOpen">Resources</option>
                    <option value="Users">Community</option>
                    <option value="MessageCircle">WhatsApp</option>
                  </select>
                </div>
                <button onClick={() => removeExploreLink(i)} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
