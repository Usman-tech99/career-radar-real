import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import RadarScan from '../../components/ui/RadarScan'
import ReviewsMarquee from '../../components/ui/ReviewsMarquee'
import { BlurFade } from '../../components/magicui/blur-fade'
import { ShimmerButton } from '../../components/magicui/shimmer-button'
import { BorderBeam } from '../../components/magicui/border-beam'
import { AnimatedGradientText } from '../../components/magicui/animated-gradient-text'
import { NumberTicker } from '../../components/magicui/number-ticker'
import { ArrowRight, Zap, Target, Users, BookOpen } from 'lucide-react'

const stats = [
  { value: 500, suffix: '+', label: 'Jobs Listed' },
  { value: 1200, suffix: '+', label: 'Active Users' },
  { value: 50, suffix: '+', label: 'Resources' },
  { value: 98, suffix: '%', label: 'Free Access' },
]

const features = [
  { icon: Zap, title: 'Radar AI Assistant', desc: 'Chat with our intelligent career coach for instant guidance and resume reviews.', color: 'text-green', beamColor: '#10B981' },
  { icon: Target, title: 'Dynamic Blueprints', desc: 'Generate personalized action plans tailored to your specific goals and skills.', color: 'text-blue-accent', beamColor: '#3B82F6' },
  { icon: BookOpen, title: 'Skill Library', desc: 'Free courses, ebooks, and templates designed to help you upskill and advance.', color: 'text-gold', beamColor: '#F59E0B' },
  { icon: Users, title: 'Community Network', desc: 'Connect with mentors, collaborators, and fellow professionals worldwide.', color: 'text-purple-accent', beamColor: '#8B5CF6' },
]

function FeatureCard({ icon: Icon, title, desc, color, beamColor, index }) {
  return (
    <BlurFade delay={index * 0.12} offset={10} blur="4px">
      <div className="relative group h-full">
        <div className="glass-card relative z-10 flex flex-col items-center text-center p-6 md:p-8 h-full overflow-hidden rounded-2xl">
          <BorderBeam size={80} delay={index * 2} duration={8} colorFrom={beamColor} colorTo={beamColor} borderWidth={1} />
          <div className={`w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-5 border border-white/[0.06] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
            <Icon size={28} className={`${color} transition-colors`} />
          </div>
          <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
          <p className="text-sm text-muted leading-relaxed">{desc}</p>
        </div>
      </div>
    </BlurFade>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#07070C] flex flex-col relative overflow-hidden">
      <Navbar />
      
      {/* Aurora Backgrounds */}
      <motion.div
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.05, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-gradient-to-b from-green/20 to-transparent blur-[150px] pointer-events-none"
      />
      <motion.div
        animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.08, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-blue-accent/10 blur-[150px] rounded-full pointer-events-none"
      />
      <motion.div
        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.06, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-0 left-[-10%] w-[500px] h-[500px] bg-purple-accent/10 blur-[150px] rounded-full pointer-events-none"
      />

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green/30 bg-green/10 text-green font-medium text-sm mb-8">
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-green"
            />
            Radar AI 2.0 is now live
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold font-sora tracking-tight text-white mb-6 leading-[1.1]">
            Navigate Your Career <br />
            <AnimatedGradientText speed={1.5} colorFrom="#10B981" colorTo="#60A5FA" className="text-5xl md:text-7xl">
              Powered by AI
            </AnimatedGradientText>
          </h1>
          
          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Career Radar is your personalized GPS for the future of work. Get AI-driven roadmaps, discover remote jobs, and unlock premium resources designed for students and freelancers.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <ShimmerButton
              as={Link}
              to="/register"
              shimmerColor="#10B981"
              background="#10B981"
              borderRadius="14px"
              className="text-lg px-8 py-4 font-semibold gap-2 w-full sm:w-auto"
            >
              Join Free <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </ShimmerButton>
            <Link to="/about" className="btn-ghost w-full sm:w-auto text-lg px-8 py-4 border border-white/10 hover:border-white/20">
              Learn More
            </Link>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <BlurFade delay={0.3} offset={12} blur="3px" className="w-full max-w-4xl mx-auto mt-16">
          <div className="glass-card p-6 md:p-8 rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-black font-mono text-green">
                    <NumberTicker value={s.value} delay={0.3 + i * 0.15} />
                    <span>{s.suffix}</span>
                  </div>
                  <div className="text-sm text-muted mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </BlurFade>

        {/* Feature Cards */}
        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} index={i} />
          ))}
        </div>

        {/* Radar Scan */}
        <BlurFade delay={0.4} offset={15} blur="5px" className="w-full mt-20 mb-8">
          <RadarScan />
        </BlurFade>

        {/* Testimonials */}
        <BlurFade delay={0.3} offset={12} blur="4px" className="w-full mt-24">
          <h3 className="text-center text-xs font-bold tracking-[0.2em] text-muted uppercase mb-2">Testimonials</h3>
          <p className="text-center text-2xl md:text-3xl font-bold font-sora text-white mb-6">What Our <span className="text-green">Users</span> Say</p>
          <ReviewsMarquee />
        </BlurFade>
      </main>

      <Footer />
    </div>
  )
}