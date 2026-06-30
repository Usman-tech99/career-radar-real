import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import SafeImage from './SafeImage'
import { Crown } from 'lucide-react'

const founderRoles = ['Founder', 'Co-Founder', 'CEO', 'CTO']

function isFounder(role) {
  return founderRoles.some(r => role?.toLowerCase().includes(r.toLowerCase()))
}

export default function TeamMarquee({ className = '' }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: false, margin: '-50px' })

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      if (data) {
        const sorted = [...data].sort((a, b) => {
          const aF = isFounder(a.role) ? 0 : 1
          const bF = isFounder(b.role) ? 0 : 1
          if (aF !== bF) return aF - bF
          return (a.sort_order || 99) - (b.sort_order || 99)
        })
        setMembers(sorted)
      }
      setLoading(false)
    }
    fetch()
  }, [])

  // Triple the list for seamless infinite scroll
  const tripled = [...members, ...members, ...members]

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Gradient fades on edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-[#07070C] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-[#07070C] to-transparent pointer-events-none" />

      {loading ? (
        <div className="flex gap-6 py-4">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton w-44 h-56 rounded-2xl shrink-0" />)}
        </div>
      ) : members.length === 0 ? null : (
        <motion.div
          animate={isInView ? { x: [0, -members.length * 220] } : { x: 0 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="flex gap-6 py-4"
          style={{ width: 'max-content' }}
        >
          {tripled.map((member, i) => (
            <motion.div
              key={`${member.id}-${i}`}
              whileHover={{ y: -8, scale: 1.02 }}
              className="glass-card shrink-0 w-44 p-5 flex flex-col items-center text-center cursor-default group"
            >
              <div className="relative mb-3">
                {isFounder(member.role) && (
                  <div className="absolute -inset-2 bg-gold/20 rounded-full blur-md" />
                )}
                <SafeImage
                  src={member.image_url}
                  alt={member.name}
                  className={`w-16 h-16 rounded-full object-cover border-2 ${
                    isFounder(member.role) ? 'border-gold/30' : 'border-white/[0.06]'
                  }`}
                />
              </div>
              <h4 className="text-sm font-bold text-white truncate w-full">{member.name}</h4>
              <p className={`text-[11px] font-medium mt-0.5 flex items-center gap-1 ${
                isFounder(member.role) ? 'text-gold' : 'text-green'
              }`}>
                {isFounder(member.role) && <Crown size={10} />}
                {member.role}
              </p>
              {member.skills?.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mt-2">
                  {member.skills.slice(0, 2).map((s, j) => (
                    <span key={j} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.05] text-muted">{s}</span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}