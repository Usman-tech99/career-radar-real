import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Server, Users, BookOpen, Globe, ChevronDown, Copy, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const AMOUNT_OPTIONS = [
  { value: 1, label: 'Coffee', desc: '$1' },
  { value: 2, label: 'Snack', desc: '$2' },
  { value: 5, label: 'Meal', desc: '$5' },
  { value: 10, label: 'Monthly', desc: '$10' },
]

const METHODS = [
  { id: 'easypaisa', label: 'Easypaisa', icon: '📱', desc: 'Pakistani mobile money' },
  { id: 'nayapay', label: 'Nayapay', icon: '💳', desc: 'Pakistani payment platform' },
  { id: 'raast', label: 'Raast', icon: '🏦', desc: 'Pakistani real-time payment' },
  { id: 'binance', label: 'Binance', icon: '🪙', desc: 'Cryptocurrency payments', comingSoon: true },
]

const FAQS = [
  { q: 'Is my donation secure?', a: 'Yes, all donations are processed securely through trusted payment providers. We never store sensitive payment information.' },
  { q: 'How do I confirm my donation?', a: 'After sending the payment to the account details provided, click "Continue on WhatsApp" with your name and amount. We\'ll verify and update you within 24 hours.' },
  { q: 'Will my donation be public?', a: 'By default, your name appears on our donor list. You can choose to donate anonymously by mentioning it on WhatsApp.' },
  { q: 'What if I send the wrong amount?', a: 'No worries — just mention the correct amount on WhatsApp and we\'ll adjust our records.' },
]

const WHATSAPP_NUMBER = '923275878584'

export default function Donate() {
  const [amount, setAmount] = useState(5)
  const [method, setMethod] = useState('easypaisa')
  const [name, setName] = useState('')
  const [faqOpen, setFaqOpen] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Please enter your name')
    const text = encodeURIComponent(`My name is ${name.trim()} and i want to support Career Radar with $${amount}`)
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank')
  }

  function copyAccount() {
    navigator.clipboard.writeText('03275878584')
    toast.success('Account number copied!')
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green/10 border border-green/20 text-green text-sm font-medium mb-4">
            <Heart size={14} /> Support Our Mission
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-sora text-white mb-4">Help Us Grow</h1>
          <p className="text-muted max-w-2xl mx-auto leading-relaxed">
            Career Radar is a free platform dedicated to helping students and professionals discover opportunities and grow their careers. Your support helps us continue this mission.
          </p>
        </motion.div>

        {/* How Donations Help */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { icon: Server, label: 'Server & Hosting', desc: 'Keep Career Radar running 24/7' },
            { icon: Users, label: 'Community Support', desc: 'Maintain and grow our community' },
            { icon: BookOpen, label: 'Content Creation', desc: 'Produce quality resources and guides' },
            { icon: Globe, label: 'Global Reach', desc: 'Expand to help more students' },
          ].map((item, i) => (
            <div key={i} className="glass-card p-5 text-center">
              <item.icon size={28} className="text-green mx-auto mb-3" />
              <h3 className="text-white font-semibold text-sm mb-1">{item.label}</h3>
              <p className="text-muted text-xs">{item.desc}</p>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-16">
          {/* Donation Form */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="md:col-span-3 glass-card p-6 md:p-8">
            <h2 className="text-2xl font-bold font-sora text-white mb-6">Make a Donation</h2>
            <p className="text-muted text-sm mb-6">Choose your donation amount and payment method</p>

            {/* Amount */}
            <div className="mb-6">
              <label className="text-sm font-medium text-white mb-3 block">Amount</label>
              <div className="grid grid-cols-4 gap-3">
                {AMOUNT_OPTIONS.map((a) => (
                  <button key={a.value} onClick={() => setAmount(a.value)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      amount === a.value ? 'border-green bg-green/10 text-green' : 'border-border text-muted hover:border-white/20'
                    }`}
                  >
                    <div className="text-lg font-bold">{a.desc}</div>
                    <div className="text-xs mt-0.5">{a.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Method */}
            <div className="mb-6">
              <label className="text-sm font-medium text-white mb-3 block">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                {METHODS.map((m) => (
                  <button key={m.id} onClick={() => !m.comingSoon && setMethod(m.id)}
                    className={`p-4 rounded-xl border text-left transition-all relative ${
                      m.comingSoon ? 'opacity-40 cursor-not-allowed' :
                      method === m.id ? 'border-green bg-green/10' : 'border-border hover:border-white/20'
                    }`}
                  >
                    <span className="text-xl mb-1 block">{m.icon}</span>
                    <div className="font-semibold text-white text-sm">{m.label}</div>
                    <div className="text-xs text-muted mt-0.5">{m.desc}</div>
                    {m.comingSoon && <span className="absolute top-2 right-2 text-[10px] bg-white/10 text-muted px-1.5 py-0.5 rounded">Soon</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-white/[0.04] border border-border rounded-xl px-4 py-3 text-white text-sm placeholder:text-muted focus:outline-none focus:border-green/50 transition-colors" />

              <button type="submit" className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
                <MessageCircle size={18} />
                Continue on WhatsApp — ${amount}
              </button>
            </form>
          </motion.div>

          {/* Account Details */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="md:col-span-2 glass-card p-6 md:p-8 self-start">
            <h3 className="text-xl font-bold font-sora text-white mb-4">{METHODS.find(m => m.id === method)?.label}</h3>

            {method === 'easypaisa' && (
              <div className="space-y-4">
                <div className="bg-white/[0.04] border border-border rounded-xl p-4">
                  <div className="text-xs text-muted uppercase tracking-wider mb-1">Account Details</div>
                  <div className="text-2xl font-bold text-green tracking-wider mb-2">03275878584</div>
                  <button onClick={copyAccount} className="btn-ghost text-xs flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-border">
                    <Copy size={12} /> Copy Number
                  </button>
                </div>
                <div className="bg-white/[0.04] rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted leading-relaxed">
                    Send your donation to the account above, then click <strong className="text-white">Continue on WhatsApp</strong> to confirm. We'll verify and update you within 24 hours.
                  </p>
                </div>
                <div className="bg-green/5 border border-green/20 rounded-xl p-4">
                  <div className="text-xs text-muted uppercase tracking-wider mb-2">Donation Amount</div>
                  <div className="text-lg font-bold text-green">${amount}</div>
                </div>
              </div>
            )}

            {method === 'nayapay' && (
              <div className="space-y-4">
                <p className="text-sm text-muted leading-relaxed">Coming soon — we're integrating Nayapay checkout.</p>
                <div className="bg-white/[0.04] rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted">Until then, please use Easypaisa to donate.</p>
                </div>
              </div>
            )}

            {method === 'raast' && (
              <div className="space-y-4">
                <p className="text-sm text-muted leading-relaxed">Raast P2P transfers coming soon with IBAN details.</p>
                <div className="bg-white/[0.04] rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted">Until then, please use Easypaisa to donate.</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
          <h2 className="text-2xl font-bold font-sora text-white mb-6 text-center">Frequently Asked Questions</h2>
          <div className="max-w-2xl mx-auto space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="glass-card overflow-hidden">
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left">
                  <span className="text-white font-medium text-sm">{faq.q}</span>
                  <ChevronDown size={16} className={`text-muted transition-transform shrink-0 ${faqOpen === i ? 'rotate-180' : ''}`} />
                </button>
                {faqOpen === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-muted leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Closing */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center glass-card p-10">
          <Heart size={36} className="text-green mx-auto mb-4" />
          <h2 className="text-2xl font-bold font-sora text-white mb-3">Every Donation Counts</h2>
          <p className="text-muted max-w-lg mx-auto leading-relaxed mb-6">
            Whether it's $1 or $100, your support helps us continue our mission to empower students and professionals worldwide.
          </p>
          <p className="text-green font-semibold">Thank you for believing in Career Radar!</p>
        </motion.div>
      </div>
    </div>
  )
}