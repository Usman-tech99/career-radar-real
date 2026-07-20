import { useRef } from 'react'
import { motion, useMotionValue, useAnimationFrame, useInView } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const reviews = [
  { name: 'Ayesha Khan', role: 'CS Student, LUMS', stars: 5, text: 'Career Radar helped me land my first remote internship. The AI roadmap was eerily accurate about what skills I needed.' },
  { name: 'Bilal Ahmed', role: 'Freelance Developer', stars: 5, text: 'The job matching algorithm actually understands Pakistani job market. Found 3 quality leads in my first week.' },
  { name: 'Fatima Tariq', role: 'Fresh Graduate', stars: 5, text: 'From confused graduate to having a clear 6-month action plan. The blueprint feature is a game changer.' },
  { name: 'Usman Javed', role: 'UX Designer', stars: 4, text: 'The career score feature gave me concrete metrics to work on. I went from 52 to 78 in two months.' },
  { name: 'Zainab Ali', role: 'Data Science Intern', stars: 5, text: 'Finally a platform built for Pakistani students. The scholarship section alone is worth signing up for.' },
  { name: 'Hassan Raza', role: 'Business Graduate', stars: 4, text: 'The AI chat helped me rewrite my CV and prepare for interviews. Landed a job at a tech startup in 3 weeks.' },
  { name: 'Sana Mahmood', role: 'Software Engineer', stars: 5, text: 'I recommend Career Radar to all my juniors. The AI-powered roadmap saved me months of confusion.' },
  { name: 'Omar Farooq', role: 'Marketing Lead', stars: 4, text: 'Switched careers from marketing to tech using the blueprint. The step-by-step plan was incredibly practical.' },
]

export default function ReviewsMarquee({ className = '' }) {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: false, margin: '-50px' })
  const x = useMotionValue(0)

  const CARD_W = 380
  const setWidth = reviews.length * CARD_W

  useAnimationFrame((_, delta) => {
    if (!isInView) return
    const speed = 25
    const newX = x.get() - (speed * delta) / 1000
    if (newX <= -setWidth) {
      x.set(0)
    } else {
      x.set(newX)
    }
  })

  const tripled = [...reviews, ...reviews, ...reviews]

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      <div className="absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-[#07070C] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-[#07070C] to-transparent pointer-events-none" />

      <motion.div
        style={{ x }}
        className="flex gap-6 py-4"
      >
        {tripled.map((r, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="shrink-0 cursor-default group relative rounded-xl p-[1px]"
            style={{ width: CARD_W - 24 }}
          >
            {/* neon gradient border */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-gold/40 via-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {/* glow layers */}
            <div className="absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-[6px] bg-gold/20" />
            <div className="absolute -inset-[3px] rounded-xl opacity-0 group-hover:opacity-40 transition-all duration-700 blur-[12px] bg-gold/20" />
            {/* card body */}
            <div className="glass-card relative z-10 flex flex-col p-6 rounded-xl h-full bg-[#0D0D14]">
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={13} className={j < r.stars ? 'text-gold fill-gold' : 'text-white/10'} />
                ))}
              </div>
              <Quote size={18} className="text-gold/20 mb-2" />
              <p className="text-sm text-muted leading-relaxed flex-1 mb-4 line-clamp-3">{r.text}</p>
              <div className="flex items-center gap-3 pt-3 border-t border-white/[0.05] mt-auto">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/30 to-blue-accent/30 flex items-center justify-center text-xs font-bold text-slate-100 shrink-0">
                  {r.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate">{r.name}</p>
                  <p className="text-[11px] text-muted truncate">{r.role}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}