import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft, Send } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleReset(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
    } catch (error) {
      toast.error('Failed to send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-accent/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md glass-card relative z-10 p-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <h1 className="text-2xl font-bold font-sora tracking-tight text-white">
              Career <span className="text-gold">Radar</span>
            </h1>
          </Link>
          {sent ? (
            <>
              <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
                <Send size={32} className="text-gold" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-muted text-sm">
                We've sent a password reset link to <span className="text-white font-medium">{email}</span>. 
                Click the link to reset your password.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">Forgot password?</h2>
              <p className="text-muted text-sm">Enter your email and we'll send you a reset link.</p>
            </>
          )}
        </div>

        {!sent && (
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex justify-center items-center gap-2 mt-4"
            >
              {loading ? 'Sending...' : 'Send Reset Link'} <Send size={18} />
            </button>
          </form>
        )}

        <p className="text-center text-sm text-muted mt-8">
          <Link to="/login" className="text-gold hover:underline font-medium inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}