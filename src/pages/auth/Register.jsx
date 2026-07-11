import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { ArrowRight, Mail, Lock, User } from 'lucide-react'
import { getRecaptchaToken, loadRecaptchaScript } from '../../lib/recaptcha'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { loadRecaptchaScript() }, [])

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const captchaToken = await getRecaptchaToken('register')
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          captchaToken,
        }
      })

      if (error) throw error

      toast.success('Registration successful! Please check your email to verify or continue.')
      
      // If auto-login is enabled, we'll go to onboarding. 
      // If email confirmation is required, Supabase handles it.
      if (data.session) {
        navigate('/onboarding')
      } else {
        toast('Please check your email for a verification link to complete registration.', { icon: '📧' })
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#07070C] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-accent/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-accent/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md glass-card relative z-10 p-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <h1 className="text-2xl font-bold font-sora tracking-tight text-white">
              Career <span className="text-green">Radar</span>
            </h1>
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-muted text-sm">Join the leading career community</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input 
                type="text" 
                required 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="input-field pl-10" 
                placeholder="Muhammad Usman" 
              />
            </div>
          </div>

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

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input 
                type="password" 
                required 
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field pl-10" 
                placeholder="••••••••" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full flex justify-center items-center gap-2 mt-4"
          >
            {loading ? 'Creating account...' : 'Create Account'} <ArrowRight size={18} />
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted uppercase">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })}
          className="btn-ghost border border-white/10 hover:border-white/20 w-full flex items-center justify-center gap-3 py-3"
        >
          <svg viewBox="0 0 48 48" className="w-5 h-5"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.97-5.97z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z"/></svg>
          Sign up with Google
        </button>

        <p className="text-center text-sm text-muted mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-green hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
