import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ManageErrorLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchLogs() }, [])

  async function fetchLogs() {
    setLoading(true)
    const { data, error } = await supabase.from('error_logs').select('*').order('created_at', { ascending: false }).limit(100)
    if (error) toast.error('Failed to load error logs')
    else setLogs(data || [])
    setLoading(false)
  }

  async function clearLogs() {
    if (!confirm('Delete all error logs?')) return
    const { error } = await supabase.from('error_logs').delete().gte('id', 0)
    if (error) toast.error('Failed to clear logs')
    else { setLogs([]); toast.success('Error logs cleared') }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Error Logs</h1>
          <p className="text-muted text-sm mt-1">Client-side errors reported by users.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchLogs} className="btn-ghost border border-border flex items-center gap-2 px-4 py-2 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={clearLogs} className="btn-ghost border border-red-500/20 text-red-400 flex items-center gap-2 px-4 py-2 text-sm">
            <Trash2 size={14} /> Clear All
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-card text-center py-20 text-muted">
          <AlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
          <p>No errors logged. The app is running smoothly.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id} className="glass-card p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-400 break-words">{log.message}</p>
                  <p className="text-xs text-muted mt-1 break-all">{log.url}</p>
                  {log.user_id && <p className="text-xs text-muted mt-0.5">User: {log.user_id}</p>}
                  {log.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted cursor-pointer hover:text-white">Stack trace</summary>
                      <pre className="text-xs text-muted/60 mt-1 whitespace-pre-wrap max-h-40 overflow-y-auto">{log.stack}</pre>
                    </details>
                  )}
                </div>
                <span className="text-[10px] text-muted shrink-0">{new Date(log.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
