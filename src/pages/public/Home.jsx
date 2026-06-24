import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { ArrowRight, Zap, Target, Users, BookOpen } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#07070C] flex flex-col relative overflow-hidden">
      <Navbar />
      
      {/* Background Aurora / Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-gradient-to-b from-green/20 to-transparent blur-[150px] pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-blue-accent/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[500px] h-[500px] bg-purple-accent/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green/30 bg-green/10 text-green font-medium text-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
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

        {/* Feature Cards Grid */}
        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-32">
          <FeatureCard 
            delay={0.1}
            icon={Zap} 
            title="Radar AI Assistant" 
            desc="Chat with our intelligent career coach for instant guidance and resume reviews." 
            color="text-green" 
          />
          <FeatureCard 
            delay={0.2}
            icon={Target} 
            title="Dynamic Blueprints" 
            desc="Generate personalized action plans tailored to your specific goals and skills." 
            color="text-blue-accent" 
          />
          <FeatureCard 
            delay={0.3}
            icon={BookOpen} 
            title="Premium Education" 
            desc="Access curated courses, ebooks, and templates to upskill rapidly." 
            color="text-gold" 
          />
          <FeatureCard 
            delay={0.4}
            icon={Users} 
            title="Elite Community" 
            desc="Connect with mentors, collaborators, and top-tier freelancers." 
            color="text-purple-accent" 
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc, color, delay }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card flex flex-col items-start hover:-translate-y-1 transition-transform duration-300"
    >
      <div className={`w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mb-4 border border-white/[0.05] ${color}`}>
        <Icon size={24} className="flex-shrink-0" />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted leading-relaxed text-sm">{desc}</p>
    </motion.div>
  )
}
