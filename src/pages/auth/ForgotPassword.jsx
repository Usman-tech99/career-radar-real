import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft, Send, Sparkles, KeyRound, Loader2, CheckCircle2, RotateCw } from 'lucide-react'
import { Turnstile } from '@marsidev/react-turnstile'
import { TURNSTILE_SITE_KEY } from '../../lib/turnstile'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaFailed, setCaptchaFailed] = useState(false)
  const turnstileRef = useRef(null)
  const navigate = useNavigate()

  async function handleSendReset(e) {
    if (e) e.preventDefault()
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    if (!captchaToken) {
      toast.error(
        captchaFailed
          ? 'Verification failed to load. Please refresh the page or try a different network.'
          : 'Please wait for security verification to complete'
      )
      return
    }

    setLoading(true)
    try {
      // 1. Try standard Supabase password recovery with captcha token
      const redirectUrl = `${window.location.origin}/reset-password`
      let { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
        captchaToken,
      })

      // If resetPasswordForEmail failed, try signInWithOtp as fallback
      if (error) {
        console.warn('resetPasswordForEmail failed, trying signInWithOtp fallback:', error.message)
        const otpRes = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: redirectUrl,
            captchaToken,
          },
        })
        if (otpRes.error) {
          throw error // Throw original error
        }
      }

      setSent(true)
      toast.success('Reset link sent! Please check your email inbox.')
    } catch (error) {
      console.error('Password reset error:', error)
      // Reset captcha token on error so user can re-verify if needed
      setCaptchaToken('')
      try {
        turnstileRef.current?.reset()
      } catch (_) {}

      if (error?.message?.toLowerCase().includes('rate limit')) {
        toast.error('Too many requests. Please wait a few minutes before trying again.')
      } else if (error?.message?.toLowerCase().includes('captcha')) {
        toast.error('Security verification failed. Please complete the captcha.')
      } else {
        toast.error(error.message || 'Failed to send reset link. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault()
    if (!code.trim()) {
      toast.error('Please enter the code from your email')
      return
    }

    setVerifyingCode(true)
    try {
      const cleanToken = code.trim()
      // Try verifying OTP code as recovery, email, or magiclink
      let res = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: cleanToken,
        type: 'email',
      })

      if (res.error) {
        res = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: cleanToken,
          type: 'recovery',
        })
      }

      if (res.error) throw res.error

      toast.success('Successfully verified!')
      navigate('/reset-password')
    } catch (error) {
      console.error('OTP verification error:', error)
      toast.error(error.message || 'Invalid or expired code. Please try again.')
    } finally {
      setVerifyingCode(false)
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
              <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4 text-gold animate-pulse">
                <Send size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-muted text-sm leading-relaxed">
                We've sent a password reset link to{' '}
                <span className="text-gold font-medium">{email}</span>.
              </p>
              <div className="mt-4 p-3.5 rounded-xl bg-white/[0.04] border border-border text-left text-xs text-muted flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-gold shrink-0 mt-0.5" />
                <span>
                  Click the link in the email to open the password reset page and set your new password.
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-3 text-gold">
                <Send size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Forgot Password?</h2>
              <p className="text-muted text-sm">
                Enter your email address and we'll send you a secure link to reset your password.
              </p>
            </>
          )}
        </div>

        {!sent ? (
          <form onSubmit={handleSendReset} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-center">
              <Turnstile
                ref={turnstileRef}
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={(token) => {
                  setCaptchaToken(token)
                  setCaptchaFailed(false)
                }}
                onError={() => setCaptchaFailed(true)}
                onTimeout={() => setCaptchaFailed(true)}
                onLoadScriptError={() => setCaptchaFailed(true)}
                options={{ theme: 'light' }}
              />
            </div>
            {captchaFailed && (
              <p className="text-center text-xs text-red-400 -mt-2">
                Verification could not load. Please check your connection or refresh.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex justify-center items-center gap-2 mt-4 py-3"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Sending Reset Link…
                </>
              ) : (
                <>
                  <Send size={18} /> Send Reset Link
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            {/* Fallback to enter 6-digit code if their email client stripped links */}
            {!showCodeInput ? (
              <button
                type="button"
                onClick={() => setShowCodeInput(true)}
                className="w-full text-center text-xs text-muted hover:text-gold transition-colors underline py-1"
              >
                Received a numeric code instead of a clickable link?
              </button>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-3 pt-2 border-t border-border/80">
                <label className="label text-xs">Enter code from email</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. 123456"
                    className="input-field pl-9 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifyingCode || !code.trim()}
                  className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-2"
                >
                  {verifyingCode ? <Loader2 size={14} className="animate-spin" /> : null}
                  Verify Code & Continue
                </button>
              </form>
            )}

            {/* Resend button */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleSendReset}
                disabled={loading}
                className="text-xs text-gold hover:underline inline-flex items-center gap-1.5"
              >
                <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
                Resend Reset Link
              </button>
            </div>
          </div>
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