import { Component } from 'react'
import { supabase } from '../lib/supabase'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  async componentDidCatch(error) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return
    try {
      const sanitize = (s) => typeof s === 'string' ? s.replace(/[<>]/g, '').slice(0, 1000) : ''
      const user = (await supabase.auth.getUser()).data?.user
      await supabase.from('error_logs').insert({
        user_id: user?.id || null,
        url: sanitize(window.location.href),
        message: sanitize(error?.message || 'Unknown error'),
        stack: sanitize(error?.stack || ''),
        user_agent: sanitize(navigator.userAgent || ''),
      })
    } catch (_) {
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070F1A] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
              <span className="text-red-400 text-2xl">!</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mb-2">Something went wrong</h1>
            <p className="text-muted mb-6">Please try again later.</p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
              className="btn-primary px-6 py-2"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
