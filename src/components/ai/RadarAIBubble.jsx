import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, X, Send, User, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function RadarAIBubble() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am Radar AI, your career assistant. How can I help you today? (Try "Find me a frontend job" or "How do I start freelancing?")' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const messagesEndRef = useRef(null)

  // Listen for custom event to open chat from anywhere
  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('open-radar-ai', handleOpen)
    return () => window.removeEventListener('open-radar-ai', handleOpen)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/radar-ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ 
          messages: newMessages,
          session_id: 'temp-session-' + Date.now()
        })
      })

      if (!res.ok) throw new Error('Failed to get AI response')
      
      const geminiData = await res.json()
      const aiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(geminiData)

      setMessages([...newMessages, { role: 'assistant', content: aiText }])
      
      // Log interaction asynchronously
      if (user) {
        supabase.from('ai_chat_logs').insert([{
          session_id: 'temp',
          user_id: user.id,
          user_message: userMessage.content,
          ai_response: aiText,
          mode_detected: 'general' // We can infer mode based on regex, or just log general
        }]).then() // fire and forget
      }

    } catch (err) {
      console.error(err)
      toast.error('Radar AI is currently unavailable.')
      setMessages([...newMessages, { role: 'assistant', content: "Sorry, I'm experiencing technical difficulties." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-green to-blue-accent rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center z-50 hover:scale-110 transition-transform"
          >
            <Zap className="text-[#07070C]" size={28} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[600px] max-h-[85vh] bg-[#07070C] border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-white/[0.05] p-4 flex justify-between items-center border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green to-blue-accent flex items-center justify-center">
                  <Zap size={18} className="text-[#07070C]" />
                </div>
                <div>
                  <h3 className="font-bold font-sora text-sm">Radar AI</h3>
                  <p className="text-[10px] text-green flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green rounded-full animate-pulse" /> Online
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-muted hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center ${
                    msg.role === 'user' ? 'bg-white/[0.1]' : 'bg-green/20'
                  }`}>
                    {msg.role === 'user' ? <User size={14} className="text-white" /> : <Zap size={14} className="text-green" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-blue-accent text-white rounded-tr-none' 
                      : 'bg-white/[0.05] text-white/90 rounded-tl-none border border-white/[0.05]'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-green/20 flex shrink-0 items-center justify-center">
                    <Zap size={14} className="text-green" />
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.05] rounded-tl-none border border-white/[0.05]">
                    <Loader2 size={16} className="animate-spin text-green" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-white/[0.02]">
              <form onSubmit={sendMessage} className="relative">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask for jobs, courses, or advice..."
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-full pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-green transition-colors placeholder-muted"
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-green rounded-full flex items-center justify-center disabled:opacity-50 disabled:bg-white/[0.1]"
                >
                  <Send size={14} className={input.trim() && !loading ? "text-[#07070C]" : "text-white/50"} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
