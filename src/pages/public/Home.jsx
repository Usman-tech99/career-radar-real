import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { BlurFade } from '../../components/magicui/blur-fade'
import { BorderBeam } from '../../components/magicui/border-beam'
import { NumberTicker } from '../../components/magicui/number-ticker'
import { ArrowRight, Search, Bot, BookOpen, Users, TrendingUp, Target, Compass, CheckCircle, MessageSquare, Rocket, Sparkles } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const features = [
  { icon: Search, title: 'Verified Opportunities', desc: 'Discover scholarships, internships, jobs, fellowships, competitions, conferences, and remote opportunities from trusted sources.', color: 'text-green', beamColor: '#10B981' },
  { icon: Bot, title: 'AI Career Guidance', desc: 'Get personalized career roadmaps, AI-powered recommendations, resume feedback, and practical career advice.', color: 'text-blue-accent', beamColor: '#3B82F6' },
  { icon: BookOpen, title: 'Career Resources', desc: 'Access resume templates, interview guides, AI tools, freelancing resources, productivity systems, and learning materials.', color: 'text-gold', beamColor: '#F59E0B' },
  { icon: Users, title: 'Global Community', desc: 'Join a growing network of students, graduates, freelancers, mentors, and professionals across multiple countries.', color: 'text-purple-accent', beamColor: '#8B5CF6' },
  { icon: TrendingUp, title: 'Skill Development', desc: 'Build practical AI, freelancing, communication, leadership, and career skills employers actually value.', color: 'text-green', beamColor: '#10B981' },
  { icon: Target, title: 'Career Growth', desc: 'Prepare for scholarships, internships, higher education, and future careers with structured guidance and continuous learning.', color: 'text-blue-accent', beamColor: '#3B82F6' },
]

const steps = [
  { icon: Compass, title: 'Discover', desc: 'Explore verified scholarships, internships, jobs, AI tools, and learning opportunities.' },
  { icon: TrendingUp, title: 'Develop', desc: 'Learn practical skills using curated resources, workshops, AI guidance, and career roadmaps.' },
  { icon: Users, title: 'Connect', desc: 'Join our global community to network with mentors, peers, volunteers, and professionals.' },
  { icon: Target, title: 'Grow', desc: 'Transform opportunities into real career success through consistent learning and action.' },
]

const roadmapAvailable = [
  'Verified Opportunities', 'Career Resources', 'Community Support', 'AI Learning',
]

const roadmapComing = [
  'AI Career Assistant', 'Career Readiness Score', 'Resume Builder', 'Personal Career Dashboard',
  'Opportunity Tracker', 'Student Talent Profiles', 'Employer Dashboard', 'Premium Learning Hub',
  'Mentorship Platform',
]

const whyJoin = [
  'Verified Opportunities', 'AI Career Guidance', 'Career Resources', 'Global Community',
  'Networking', 'Skill Development', 'Scholarships', 'Internships', 'Jobs', 'Freelancing',
]

function FeatureCard({ icon: Icon, title, desc, color, beamColor, index }) {
  return (
    <BlurFade delay={index * 0.1} offset={10} blur="4px">
      <div className="relative group h-full">
        <div className="glass-card relative z-10 flex flex-col items-center text-center p-6 md:p-8 h-full overflow-hidden rounded-2xl">
          <BorderBeam size={80} delay={index * 2} duration={8} colorFrom={beamColor} colorTo={beamColor} borderWidth={1} />
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-5 border border-white/[0.06] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
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
  const [siteStats, setSiteStats] = useState(null)

  useEffect(() => {
    supabase.from('site_stats').select('*').single().then(({ data }) => {
      if (data) setSiteStats(data)
    })
  }, [])

  const statItems = siteStats ? [
    { value: siteStats.community_members, suffix: '+', label: 'Community Members' },
    { value: siteStats.countries, suffix: '+', label: 'Countries' },
    { value: siteStats.whatsapp_groups, suffix: '', label: 'WhatsApp Groups' },
    { value: siteStats.main_channel_followers, suffix: '+', label: 'Main Career Channel Followers' },
    { value: siteStats.scholarship_channel_followers, suffix: '+', label: 'Scholarship & Internship Channel Followers' },
    { value: siteStats.ai_channel_followers, suffix: '+', label: 'AI Learning Channel Followers' },
  ] : []

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
            AI-Powered Career GPS for Students & Early Professionals
          </div>

          <h1 className="text-5xl md:text-7xl font-bold font-sora tracking-tight text-white mb-6 leading-[1.1]">
            Discover Opportunities. Build Skills. <br />
            <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Accelerate Your Career with AI.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted max-w-3xl mx-auto mb-10 leading-relaxed">
            Career Radar is an AI-powered career ecosystem helping students and early-career professionals discover verified scholarships, internships, jobs, AI resources, career guidance, and professional networks—all in one place. Join thousands of learners preparing for the future of work.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/social" className="btn-primary w-full sm:w-auto text-lg px-8 py-4 flex items-center justify-center gap-2">
              Join Community <ArrowRight size={20} />
            </Link>
            <Link to="/jobs" className="btn-ghost w-full sm:w-auto text-lg px-8 py-4">
              Explore Opportunities
            </Link>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <BlurFade delay={0.3} offset={12} blur="3px" className="w-full max-w-5xl mx-auto mt-16">
          <div className="glass-card p-6 md:p-8 rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {statItems.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-black font-mono text-green">
                    <NumberTicker value={s.value} delay={0.3 + i * 0.1} />
                    <span>{s.suffix}</span>
                  </div>
                  <div className="text-sm text-muted mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </BlurFade>

        {/* Why Career Radar */}
        <BlurFade delay={0.3} offset={15} blur="5px" className="w-full max-w-4xl mx-auto mt-24">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Why Career Radar?</h2>
            <p className="text-muted text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
              Students don't struggle because opportunities don't exist—they struggle because opportunities are scattered, skills change rapidly, and trusted career guidance is hard to find. Career Radar brings everything together into one AI-powered career ecosystem, making it easier to discover opportunities, build in-demand skills, connect with professionals, and grow your career.
            </p>
          </div>
        </BlurFade>

        {/* Features */}
        <div className="max-w-7xl w-full mx-auto mt-20">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">Everything You Need to Succeed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} index={i} />
            ))}
          </div>
        </div>

        {/* How It Works */}
        <BlurFade delay={0.3} offset={15} blur="5px" className="w-full max-w-5xl mx-auto mt-24">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">How Career Radar Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-full bg-green/10 border border-green/20 flex items-center justify-center mx-auto mb-4">
                  <step.icon size={28} className="text-green" />
                </div>
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green text-white text-xs font-bold mb-3">
                  {i + 1}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </BlurFade>

        {/* Roadmap */}
        <BlurFade delay={0.3} offset={15} blur="5px" className="w-full max-w-5xl mx-auto mt-24">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">Building the Future of Career Development Today</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold text-green mb-6 flex items-center gap-2">
                <Rocket size={22} /> Available Now
              </h3>
              <ul className="space-y-3">
                {roadmapAvailable.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle size={18} className="text-green shrink-0" />
                    <span className="text-white">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold text-gold mb-6 flex items-center gap-2">
                <Sparkles size={22} /> Coming Soon
              </h3>
              <ul className="space-y-3">
                {roadmapComing.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-[18px] h-[18px] rounded-full border-2 border-gold/50 flex items-center justify-center shrink-0">
                      <span className="w-[6px] h-[6px] rounded-full bg-gold/50" />
                    </span>
                    <span className="text-muted">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </BlurFade>

        {/* Founder Message */}
        <BlurFade delay={0.3} offset={15} blur="5px" className="w-full max-w-4xl mx-auto mt-24">
          <div className="glass-card p-10 md:p-14 text-center relative overflow-hidden">
            <BorderBeam size={150} duration={10} colorFrom="#10B981" colorTo="#8B5CF6" borderWidth={1} />
            <MessageSquare size={32} className="text-green mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">A Message from the Founder</h2>
            <p className="text-muted text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
              Career Radar was created with one mission: To bridge the gap between talent and opportunity. Every student deserves access to trusted career guidance, global opportunities, practical skills, and a supportive community. We're building more than a platform—we're building an ecosystem where students can grow, collaborate, and prepare for the future of work with confidence.
            </p>
          </div>
        </BlurFade>

        {/* Why People Join */}
        <BlurFade delay={0.3} offset={15} blur="5px" className="w-full max-w-4xl mx-auto mt-24">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">Why People Join Career Radar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {whyJoin.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 glass-card">
                <CheckCircle size={20} className="text-green shrink-0" />
                <span className="text-white font-medium">{item}</span>
              </div>
            ))}
          </div>
        </BlurFade>

        {/* Testimonials */}
        <BlurFade delay={0.3} offset={15} blur="5px" className="w-full max-w-4xl mx-auto mt-24">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">What Our Community Says</h2>
          <div className="glass-card p-10 md:p-14 text-center">
            <p className="text-muted text-base md:text-lg leading-relaxed max-w-3xl mx-auto italic">
              "Real success stories from our community will be featured here as members achieve scholarships, internships, jobs, and career milestones."
            </p>
          </div>
        </BlurFade>

        {/* Final CTA */}
        <BlurFade delay={0.3} offset={15} blur="5px" className="w-full mt-24 mb-8">
          <div className="glass-card p-12 md:p-16 text-center max-w-4xl mx-auto rounded-2xl relative overflow-hidden">
            <BorderBeam size={200} duration={12} colorFrom="#10B981" colorTo="#60A5FA" borderWidth={1} />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Start Your Career Journey Today</h2>
            <p className="text-muted text-base md:text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of students discovering opportunities, building skills, and preparing for the future with Career Radar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/social" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
                Join Community <ArrowRight size={20} />
              </Link>
              <Link to="/collaborators" className="btn-ghost text-lg px-8 py-4">
                Partner With Us
              </Link>
            </div>
          </div>
        </BlurFade>
      </main>

      <Footer />
    </div>
  )
}
