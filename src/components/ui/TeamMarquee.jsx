import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useAnimationFrame, useInView } from 'framer-motion'
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
  const x = useMotionValue(0)

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

  const CARD_W = 200 // card width + gap
  const setWidth = members.length * CARD_W

  useAnimationFrame((_, delta) => {
    if (!isInView || members.length === 0) return
    const speed = 35
    const newX = x.get() - (speed * delta) / 1000
    if (newX <= -setWidth) {
      x.set(0)
    } else {
      x.set(newX)
    }
  })

  const tripled = [...members, ...members, ...members]

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-[#07070C] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-[#07070C] to-transparent pointer-events-none" />

      {loading ? (
        <div className="flex gap-6 py-4">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton w-44 h-56 rounded-2xl shrink-0" />)}
        </div>
      ) : members.length === 0 ? null : (
        <motion.div
          style={{ x }}
          className="flex gap-6 py-4"
        >
          {tripled.map((member, i) => (
            <motion.div
              key={`${member.id}-${i}`}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="glass-card shrink-0 w-44 p-5 flex flex-col items-center text-center cursor-default group"
            >
              <div className="relative mb-3">
                {isFounder(member.role) && (
                  <>
                    <div className="absolute -inset-3 bg-gold/20 rounded-full blur-xl" />
                    <div className="absolute -inset-1.5 rounded-full border border-gold/25" />
                  </>
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
                isFounder(member.role) ? 'text-gold' : 'text-white'
              }`}>
                {isFounder(member.role) && <Crown size={10} />}
                {member.role}
              </p>
              {member.skills?.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mt-2">
                  {member.skills.slice(0, 2).map((s, j) => (
                    <span key={j} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.05] text-muted truncate max-w-[80px]">{s}</span>
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