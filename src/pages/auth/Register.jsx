import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { ArrowRight, Mail, Lock, User } from 'lucide-react'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })

      if (error) throw error

      toast.success('Registration successful! Please check your email to verify or continue.')
      
      // If auto-login is enabled, we'll go to onboarding. 
      // If email confirmation is required, Supabase handles it.
      if (data.session) {
        navigate('/onboarding')
      } else {
        // If email verification is on
        toast('Please check your email for a verification link.', { icon: '📧' })
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
                placeholder="John Doe" 
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
                minLength="6"
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
