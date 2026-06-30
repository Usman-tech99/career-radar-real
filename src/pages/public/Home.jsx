import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { ArrowRight, Zap, Target, Users, BookOpen } from 'lucide-react'

function Tilt3D({ children, className, tiltFactor = 10 }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 150, damping: 15 })
  const springY = useSpring(y, { stiffness: 150, damping: 15 })
  const rotateX = useTransform(springY, [-0.5, 0.5], [tiltFactor, -tiltFactor])
  const rotateY = useTransform(springX, [-0.5, 0.5], [-tiltFactor, tiltFactor])

  function handleMouse(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  function handleLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, perspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#07070C] flex flex-col relative overflow-hidden">
      <Navbar />

      {/* 3D Floating Decorative Elements */}
      <motion.div
        animate={{ y: [-20, 20, -20], rotate: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-32 left-[15%] w-3 h-3 rounded-full bg-green/40 blur-sm pointer-events-none z-0"
        style={{ transformStyle: 'preserve-3d', translateZ: 60 }}
      />
      <motion.div
        animate={{ y: [15, -25, 15], x: [0, 10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute top-48 right-[20%] w-2 h-2 rounded-full bg-blue-accent/50 blur-sm pointer-events-none z-0"
        style={{ transformStyle: 'preserve-3d', translateZ: 40 }}
      />
      <motion.div
        animate={{ y: [-10, 30, -10], rotate: [0, -15, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-1/3 left-[10%] w-1.5 h-1.5 rounded-full bg-purple-accent/40 blur-sm pointer-events-none z-0"
        style={{ transformStyle: 'preserve-3d', translateZ: 80 }}
      />
      <motion.div
        animate={{ y: [0, -30, 0], x: [-10, 10, -10] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute top-1/3 right-[12%] w-4 h-4 border border-green/20 rounded-full pointer-events-none z-0"
        style={{ transformStyle: 'preserve-3d', translateZ: 30 }}
      />

      {/* Pulsing Background Aurora */}
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

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-4 relative z-10">
        <Tilt3D tiltFactor={8} className="w-full max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green/30 bg-green/10 text-green font-medium text-sm mb-8">
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-2 h-2 rounded-full bg-green"
              />
              Radar AI 2.0 is now live
            </div>

            <h1 className="text-5xl md:text-7xl font-bold font-sora tracking-tight text-white mb-6 leading-[1.1]">
              Navigate Your Career <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green via-blue-accent to-purple-accent">
                Powered by AI
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
              Career Radar is your personalized GPS for the future of work. Get AI-driven roadmaps, discover remote jobs, and unlock premium resources designed for students and freelancers.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn-primary w-full sm:w-auto text-lg px-8 py-4 flex items-center justify-center gap-2 group">
                Start Free Trial <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/about" className="btn-ghost w-full sm:w-auto text-lg px-8 py-4">
                Our Story
              </Link>
            </div>
          </motion.div>
        </Tilt3D>

        {/* Feature Cards — staggered entrance on scroll + 3D tilt on each */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
          className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-32"
        >
          <FeatureCard icon={Zap} title="Radar AI Assistant" desc="Chat with our intelligent career coach for instant guidance and resume reviews." color="text-green" />
          <FeatureCard icon={Target} title="Dynamic Blueprints" desc="Generate personalized action plans tailored to your specific goals and skills." color="text-blue-accent" />
          <FeatureCard icon={BookOpen} title="Premium Education" desc="Access curated courses, ebooks, and templates to upskill rapidly." color="text-gold" />
          <FeatureCard icon={Users} title="Elite Community" desc="Connect with mentors, collaborators, and top-tier freelancers." color="text-purple-accent" />
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc, color }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -8, scale: 1.02 }}
      className="glass-card flex flex-col items-start"
      style={{ perspective: 800 }}
    >
      <motion.div
        whileHover={{ scale: 1.15, rotate: -8 }}
        className={`w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mb-4 border border-white/[0.05] ${color}`}
      >
        <Icon size={24} className="flex-shrink-0" />
      </motion.div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted leading-relaxed text-sm">{desc}</p>
    </motion.div>
  )
}