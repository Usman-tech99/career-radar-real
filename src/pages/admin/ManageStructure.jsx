import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/layout/AdminSidebar'
import toast from 'react-hot-toast'
import { Save, Plus, Trash2 } from 'lucide-react'

export default function ManageStructure() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    aim: '',
    mission: '',
    vision: '',
    core_values: [],
    goals: [],
    milestones: []
  })

  useEffect(() => {
    fetchStructure()
  }, [])

  async function fetchStructure() {
    const { data: structData, error } = await supabase.from('structure_page').select('*').eq('id', 1).single()
    if (error) toast.error('Failed to load structure')
    else if (structData) setData(structData)
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('structure_page').update(data).eq('id', 1)
    if (error) toast.error('Failed to save structure')
    else toast.success('Structure updated successfully')
    setSaving(false)
  }

  // Helper for JSONB arrays
  function addItem(field) {
    setData(prev => ({ ...prev, [field]: [...prev[field], ''] }))
  }

  function updateItem(field, index, value) {
    const newArr = [...data[field]]
    newArr[index] = value
    setData(prev => ({ ...prev, [field]: newArr }))
  }

  function removeItem(field, index) {
    const newArr = [...data[field]]
    newArr.splice(index, 1)
    setData(prev => ({ ...prev, [field]: newArr }))
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
            <h1 className="text-3xl font-bold">Manage Structure Page</h1>
            <p className="text-muted text-sm mt-1">Edit the Aim, Mission, and Vision sections of the public Structure page.</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={20} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Text Fields */}
          <div className="space-y-6">
            <div className="glass-card">
              <h2 className="text-xl font-bold mb-4 text-blue-accent">Aim</h2>
              <textarea 
                className="input-field h-32" 
                value={data.aim} 
                onChange={e => setData({...data, aim: e.target.value})}
                placeholder="What is the aim of Career Radar?"
              />
            </div>
            
            <div className="glass-card">
              <h2 className="text-xl font-bold mb-4 text-purple-accent">Mission</h2>
              <textarea 
                className="input-field h-32" 
                value={data.mission} 
                onChange={e => setData({...data, mission: e.target.value})}
                placeholder="What is the mission?"
              />
            </div>

            <div className="glass-card">
              <h2 className="text-xl font-bold mb-4 text-green">Vision</h2>
              <textarea 
                className="input-field h-32" 
                value={data.vision} 
                onChange={e => setData({...data, vision: e.target.value})}
                placeholder="What is the long-term vision?"
              />
            </div>
          </div>

          {/* Dynamic List Fields */}
          <div className="space-y-6">
            <DynamicListSection 
              title="Core Values" 
              items={data.core_values} 
              onAdd={() => addItem('core_values')}
              onChange={(i, val) => updateItem('core_values', i, val)}
              onRemove={(i) => removeItem('core_values', i)}
            />
            
            <DynamicListSection 
              title="Goals" 
              items={data.goals} 
              onAdd={() => addItem('goals')}
              onChange={(i, val) => updateItem('goals', i, val)}
              onRemove={(i) => removeItem('goals', i)}
            />

            <DynamicListSection 
              title="Milestones" 
              items={data.milestones} 
              onAdd={() => addItem('milestones')}
              onChange={(i, val) => updateItem('milestones', i, val)}
              onRemove={(i) => removeItem('milestones', i)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function DynamicListSection({ title, items, onAdd, onChange, onRemove }) {
  return (
    <div className="glass-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <button onClick={onAdd} className="p-1.5 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg transition-colors">
          <Plus size={16} className="text-green" />
        </button>
      </div>
      
      {items.length === 0 ? (
        <p className="text-sm text-muted">No items added.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/[0.05] flex items-center justify-center text-xs text-muted font-mono shrink-0">
                {i + 1}
              </div>
              <input 
                value={item} 
                onChange={e => onChange(i, e.target.value)} 
                className="input-field py-2"
                placeholder={`Enter ${title.toLowerCase()}...`}
              />
              <button onClick={() => onRemove(i)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
