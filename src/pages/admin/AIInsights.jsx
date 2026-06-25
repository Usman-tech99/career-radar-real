import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/layout/AdminSidebar'
import toast from 'react-hot-toast'
import { MessageSquare, BrainCircuit, Search } from 'lucide-react'
import { formatDate } from '../../lib/helpers'

export default function AIInsights() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [])

  async function fetchLogs() {
    try {
      const { data, error } = await supabase
        .from('ai_chat_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) toast.error('Failed to fetch AI logs')
      else setLogs(data || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch AI logs')
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => 
    log.user_message.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (log.mode_detected && log.mode_detected.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Simple Analytics
  const totalQueries = logs.length
  const coachCount = logs.filter(l => l.mode_detected === 'career_coach').length
  const matcherCount = logs.filter(l => l.mode_detected === 'job_matcher').length
  const contentCount = logs.filter(l => l.mode_detected === 'content_assistant').length

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BrainCircuit className="text-purple-accent" /> AI Insights
            </h1>
            <p className="text-muted text-sm mt-1">Super Admin only. Monitor what users are asking the AI (last 100 queries).</p>
          </div>
        </div>

        {loading ? (
          <div className="skeleton w-full h-32 rounded-2xl"></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard title="Total Queries" value={totalQueries} />
              <StatCard title="Career Coaching" value={coachCount} color="text-blue-400" />
              <StatCard title="Job Matching" value={matcherCount} color="text-green" />
              <StatCard title="Content Search" value={contentCount} color="text-gold" />
            </div>

            <div className="glass-card mb-6 flex items-center gap-3">
              <Search className="text-muted" size={20} />
              <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search queries or modes..." 
                className="bg-transparent border-none outline-none flex-1 text-white placeholder-muted"
              />
            </div>

            <div className="glass-card overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-[#94A3B8] font-medium w-48">Date / Time</th>
                    <th className="p-4 text-[#94A3B8] font-medium w-32">Mode</th>
                    <th className="p-4 text-[#94A3B8] font-medium w-1/3">User Message</th>
                    <th className="p-4 text-[#94A3B8] font-medium w-1/3">AI Response Snapshot</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-white/[0.02] align-top">
                      <td className="p-4 text-xs text-muted whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          log.mode_detected === 'career_coach' ? 'bg-blue-500/20 text-blue-400' :
                          log.mode_detected === 'job_matcher' ? 'bg-green/20 text-green' :
                          log.mode_detected === 'content_assistant' ? 'bg-gold/20 text-gold' :
                          'bg-white/10 text-white'
                        }`}>
                          {log.mode_detected || 'general'}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium">
                        {log.user_message}
                      </td>
                      <td className="p-4 text-xs text-muted">
                        <div className="line-clamp-3 bg-white/[0.02] p-2 rounded-lg border border-border">
                          {log.ai_response}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-muted">No logs match your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ title, value, color = "text-white" }) {
  return (
    <div className="glass-card p-6">
      <p className="text-muted text-sm font-medium">{title}</p>
      <p className={`text-3xl font-bold mt-2 font-mono ${color}`}>{value}</p>
    </div>
  )
}
