import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { BlurFade } from '../../components/magicui/blur-fade'
import { BorderBeam } from '../../components/magicui/border-beam'

import { ArrowRight, Search, Bot, BookOpen, Users, TrendingUp, Target, Compass, CheckCircle, Rocket, Sparkles, Quote } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { CardContainer, CardBody, CardItem } from '../../components/ui/3d-card'
import { Helmet } from 'react-helmet-async'

function AnimatedStat({ value }) {
  const [display, setDisplay] = useState(0)
  const prevRef = useRef(0)
  const rafRef = useRef(null)

  useEffect(() => {
    const target = Number(value) || 0
    if (target === prevRef.current) return
    const startVal = prevRef.current
    const startTime = performance.now()
    const duration = 1500

    function tick(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.floor(startVal + (target - startVal) * eased)
      setDisplay(current)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        prevRef.current = target
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value])

  return <>{display.toLocaleString()}</>
}

const features = [
  { icon: Search, title: 'Verified Opportunities', desc: 'Discover scholarships, internships, jobs, fellowships, competitions, conferences, and remote opportunities from trusted sources.', color: 'text-amber-400', beamColor: '#F5A623', wide: false },
  { icon: Bot, title: 'AI Career Guidance', desc: 'Get personalized career roadmaps, AI-powered recommendations, resume feedback, and practical career advice.', color: 'text-blue-accent', beamColor: '#3B82F6', wide: true },
  { icon: BookOpen, title: 'Career Resources', desc: 'Access resume templates, interview guides, AI tools, freelancing resources, productivity systems, and learning materials.', color: 'text-amber-400', beamColor: '#F59E0B', wide: false },
  { icon: Users, title: 'Global Community', desc: 'Join a growing network of students, graduates, freelancers, mentors, and professionals across multiple countries.', color: 'text-purple-accent', beamColor: '#8B5CF6', wide: false },
  { icon: TrendingUp, title: 'Skill Development', desc: 'Build practical AI, freelancing, communication, leadership, and career skills employers actually value.', color: 'text-amber-400', beamColor: '#F5A623', wide: false },
  { icon: Target, title: 'Career Growth', desc: 'Prepare for scholarships, internships, higher education, and future careers with structured guidance and continuous learning.', color: 'text-blue-accent', beamColor: '#3B82F6', wide: true },
]

const steps = [
  { icon: Compass, title: 'Discover', desc: 'Explore verified scholarships, internships, jobs, AI tools, and learning opportunities.' },
  { icon: TrendingUp, title: 'Develop', desc: 'Learn practical skills using curated resources, workshops, AI guidance, and career roadmaps.' },
  { icon: Users, title: 'Connect', desc: 'Join our global community to network with mentors, peers, volunteers, and professionals.' },
  { icon: Target, title: 'Grow', desc: 'Transform opportunities into real career success through consistent learning and action.' },
]

const roadmapAvailable = [
  'Verified Opportunities', 'Career Resources', 'Community Support', 'AI Learning',
  'AI Career Assistant', 'Career Readiness Score', 'Resume Builder',
  'Personal Career Dashboard', 'Student Talent Profiles',
]

const roadmapComing = [
  'Opportunity Tracker', 'Employer Dashboard', 'Premium Learning Hub',
  'Mentorship Platform',
]

const whyJoin = [
  'Verified Opportunities', 'AI Career Guidance', 'Career Resources', 'Global Community',
  'Networking', 'Skill Development', 'Scholarships', 'Internships', 'Jobs', 'Freelancing',
]

const testimonials = [
  { name: 'Sarah Ahmed', role: 'CS Student', quote: 'Career Radar helped me find a fully-funded scholarship I never knew existed. The AI guidance made the whole application process so much clearer.', achievement: 'Fulbright Scholar 2026' },
  { name: 'Ali Raza', role: 'Fresh Graduate', quote: 'The resume builder and career readiness score gave me the confidence to apply for jobs. Landed my first role within 2 months of joining.', achievement: 'Software Engineer at DevsInc' },
  { name: 'Fatima Khan', role: 'Early Professional', quote: 'The community here is incredible. I connected with mentors who guided me through my freelancing journey. Now I work remotely for international clients.', achievement: 'Top Rated Freelancer' },
]

function BentoFeatureCard({ icon: Icon, title, desc, color, beamColor, index, wide }) {
  return (
    <BlurFade delay={index * 0.08} offset={10} blur="4px">
      <div className={`h-full ${wide ? 'md:col-span-2' : ''}`}>
        <CardContainer className="w-full h-full" containerClassName="w-full h-full">
          <CardBody className="glass-card relative flex flex-col items-start text-left p-6 md:p-8 h-full overflow-hidden rounded-2xl border border-white/[0.06]">
            <BorderBeam size={120} delay={index * 2} duration={10} colorFrom={beamColor} colorTo={beamColor} borderWidth={1} />
            <CardItem translateZ={40} className={`w-12 h-12 rounded-xl ${color.replace('text', 'bg')}/10 flex items-center justify-center mb-5 border border-white/[0.06]`}>
              <Icon size={24} className={color} />
            </CardItem>
            <CardItem translateZ={30} className="text-lg font-bold text-white mb-3">{title}</CardItem>
            <CardItem translateZ={20} className="text-sm text-muted leading-relaxed">{desc}</CardItem>
          </CardBody>
        </CardContainer>
      </div>
    </BlurFade>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [siteStats, setSiteStats] = useState(null)

  useEffect(() => {
    supabase.from('site_stats').select('*').single().then(({ data, error }) => {
      if (error) console.error('Stats fetch error:', error)
      if (data) setSiteStats(data)
    })
  }, [])

  return (
    <div className="min-h-screen bg-surface flex flex-col relative w-full">
      <Helmet>
        <title>Career Radar &mdash; AI-Powered Career GPS for Students & Professionals</title>
        <meta name="description" content="Discover verified scholarships, internships, jobs, and AI-powered career guidance. Join our global community and accelerate your career journey with Career Radar." />
        <meta property="og:title" content="Career Radar &mdash; AI-Powered Career GPS for Students & Professionals" />
        <meta property="og:description" content="Discover verified scholarships, internships, jobs, and AI-powered career guidance. Join our global community and accelerate your career journey with Career Radar." />
        <meta property="og:type" content="website" />
        <meta name="keywords" content="career radar, AI career tools, scholarships, internships, jobs, career guidance" />
      </Helmet>
      <Navbar />

      {/* Hero Section */}
      <div className="w-full bg-navy relative overflow-hidden">
        {/* Subtle concentric ring decoration */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[900px] h-[900px] rounded-full border border-amber-400/[0.08]" />
          <div className="absolute w-[700px] h-[700px] rounded-full border border-amber-400/[0.06]" />
          <div className="absolute w-[500px] h-[500px] rounded-full border border-amber-400/[0.05]" />
          <div className="absolute w-[300px] h-[300px] rounded-full border border-amber-400/[0.04]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-28 pb-20 md:pt-36 md:pb-28 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#2A3A4A] text-amber-400 text-xs font-semibold uppercase tracking-wider mb-6">
                YOUR OPPORTUNITY SCANNER
              </div>

              {/* Heading */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                <span className="text-slate-100">Find. Prepare.</span><br />
                <span className="text-amber-400">Succeed.</span>
              </h1>

              {/* Subheading */}
              <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl mb-8">
                A one-stop ecosystem for students and early-career professionals to discover opportunities and build the skills to win them.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link to="/jobs" className="bg-amber-400 text-navy-dark font-semibold px-8 py-3.5 rounded-xl inline-flex items-center justify-center gap-2 hover:bg-amber-500 transition-colors text-base">
                  Explore Opportunities <ArrowRight size={18} />
                </Link>
                <Link to="/social" className="border border-white/20 text-slate-100 font-semibold px-8 py-3.5 rounded-xl inline-flex items-center justify-center gap-2 hover:bg-white/5 transition-colors text-base">
                  Join the Community
                </Link>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 min-h-[80px]">
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-amber-400"><AnimatedStat value={siteStats?.community_members} />+</div>
                  <div className="text-sm text-slate-400">Community Members</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-amber-400"><AnimatedStat value={siteStats?.countries} />+</div>
                  <div className="text-sm text-slate-400">Countries</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-amber-400"><AnimatedStat value={siteStats?.whatsapp_groups} /></div>
                  <div className="text-sm text-slate-400">WhatsApp Groups</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-amber-400"><AnimatedStat value={siteStats?.main_channel_followers} />+</div>
                  <div className="text-sm text-slate-400">Main Career Channel Followers</div>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Video */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
              <div className="rounded-2xl overflow-hidden">
                <video autoPlay muted loop playsInline webkit-playsinline preload="auto" className="w-full h-auto object-cover rounded-2xl">
                  <source src="/hero-video.mp4" type="video/mp4" />
                </video>
              </div>
              {/* Floating Card Overlay */}
              <div className="absolute -bottom-4 left-4 bg-white rounded-xl p-4 shadow-lg">
                <div className="text-xl font-bold text-navy"><AnimatedStat value={siteStats?.community_members} />+</div>
                <div className="text-xs text-slate-500">community members</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <main className="flex-1 w-full flex flex-col items-center pb-20 px-4 relative z-10">

        {/* Site Search */}
        <BlurFade delay={0.3} offset={12} blur="3px" className="w-full max-w-3xl mx-auto mt-16 md:mt-28">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold font-sora text-white mb-2">Search Career Radar</h2>
            <p className="text-muted text-sm md:text-base mb-6">Find jobs, scholarships, resources, and more.</p>
            <form
              onSubmit={e => { e.preventDefault(); const q = e.target.q.value.trim(); if (q) navigate(`/search?q=${encodeURIComponent(q)}`) }}
              className="flex gap-2 max-w-xl mx-auto"
            >
              <div className="relative flex-1">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  name="q"
                  type="text"
                  placeholder="Search jobs, scholarships, resources..."
                  className="w-full bg-white border border-border rounded-xl pl-12 pr-4 py-4 text-navy focus:outline-none focus:border-amber-400 text-base"
                />
              </div>
              <button type="submit" className="btn-primary px-6 py-4 rounded-xl text-sm font-semibold shrink-0">
                Search
              </button>
            </form>
          </div>
        </BlurFade>

        {/* Why Career Radar */}
        <BlurFade delay={0.3} offset={15} blur="5px" className="w-full max-w-4xl mx-auto mt-16 md:mt-28">
          <div className="text-center">
            <h2 className="text-3xl md:text-5xl font-bold font-sora text-white mb-6">Why Career Radar?</h2>
            <p className="text-muted text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
              Students don't struggle because opportunities don't exist&mdash;they struggle because opportunities are scattered, skills change rapidly, and trusted career guidance is hard to find. Career Radar brings everything together into one AI-powered career ecosystem.
            </p>
          </div>
        </BlurFade>
        {/* Features - Bento Grid */}
        <div className="max-w-7xl w-full mx-auto mt-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold font-sora text-white mb-4">Everything You Need to Succeed</h2>
            <p className="text-muted text-base md:text-lg max-w-2xl mx-auto">From discovery to growth &mdash; all in one platform designed for your career journey.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <BentoFeatureCard key={i} {...f} index={i} />
            ))}
          </div>
        </div>

        {/* How It Works */}
        <BlurFade delay={0.3} offset={15} blur="5px" className="w-full max-w-5xl mx-auto mt-16 md:mt-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold font-sora text-white mb-4">How Career Radar Works</h2>
            <p className="text-muted text-base md:text-lg max-w-2xl mx-auto">Four simple steps to transform your career journey.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="relative inline-flex mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                    <step.icon size={28} className="text-amber-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-400 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </BlurFade>

        {/* Why People Join */}
        <BlurFade delay={0.3} offset={15} blur="5px" className="w-full max-w-4xl mx-auto mt-16 md:mt-28">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold font-sora text-white mb-4">Why People Join Career Radar</h2>
            <p className="text-muted text-base md:text-lg max-w-2xl mx-auto">Everything you need to accelerate your career, all in one place.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {whyJoin.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 p-4 glass-card">
                <CheckCircle size={20} className="text-amber-400 shrink-0" />
                <span className="text-white font-medium">{item}</span>
              </motion.div>
            ))}
          </div>
        </BlurFade>

        {/* Testimonials */}
        <BlurFade delay={0.3} offset={15} blur="5px" className="w-full max-w-5xl mx-auto mt-16 md:mt-28">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold font-sora text-white mb-4">What Our Community Says</h2>
            <p className="text-muted text-base md:text-lg max-w-2xl mx-auto">Real stories from real members achieving real results.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <CardContainer key={i} className="w-full h-full" containerClassName="w-full h-full">
                <CardBody className="glass-card p-6 flex flex-col h-full rounded-2xl border border-white/[0.06]">
                  <CardItem translateZ={30}>
                    <Quote size={20} className="text-amber-400/40 mb-4" />
                  </CardItem>
                  <CardItem translateZ={20} className="text-sm text-muted leading-relaxed mb-6 flex-1">&ldquo;{t.quote}&rdquo;</CardItem>
                  <CardItem translateZ={10} className="pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                        {t.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{t.name}</p>
                        <p className="text-amber-400 text-xs">{t.achievement}</p>
                      </div>
                    </div>
                  </CardItem>
                </CardBody>
              </CardContainer>
            ))}
          </div>
        </BlurFade>

        {/* Roadmap */}
        <BlurFade delay={0.3} offset={15} blur="5px" className="w-full max-w-5xl mx-auto mt-16 md:mt-28">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold font-sora text-white mb-4">Building the Future of Career Development</h2>
            <p className="text-muted text-base md:text-lg max-w-2xl mx-auto">Today we deliver verified opportunities, career resources, community support, and AI learning. Coming soon: even more powerful tools.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold text-amber-400 mb-6 flex items-center gap-2">
                <Rocket size={22} /> Available Now
              </h3>
              <ul className="space-y-3">
                {roadmapAvailable.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle size={18} className="text-amber-400 shrink-0" />
                    <span className="text-white">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold text-amber-400 mb-6 flex items-center gap-2">
                <Sparkles size={22} /> Coming Soon
              </h3>
              <ul className="space-y-3">
                {roadmapComing.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-[18px] h-[18px] rounded-full border-2 border-amber-400/50 flex items-center justify-center shrink-0">
                      <span className="w-[6px] h-[6px] rounded-full bg-amber-400/50" />
                    </span>
                    <span className="text-muted">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </BlurFade>

        {/* Founder Message */}
        <BlurFade delay={0.3} offset={15} blur="5px" className="w-full max-w-4xl mx-auto mt-16 md:mt-28">
          <div className="glass-card p-6 md:p-10 text-center relative overflow-hidden">
            <BorderBeam size={150} duration={10} colorFrom="#F5A623" colorTo="#8B5CF6" borderWidth={1} />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">A Message from the Founder</h2>
            <div className="relative w-full aspect-video max-w-3xl mx-auto rounded-xl overflow-hidden">
              <iframe src="https://www.youtube-nocookie.com/embed/BTWmQzuCjyc" title="Founder Message" allow="autoplay; encrypted-media" allowFullScreen loading="lazy" className="absolute inset-0 w-full h-full" />
            </div>
          </div>
        </BlurFade>

        <BlurFade delay={0.3} offset={15} blur="5px" className="w-full max-w-4xl mx-auto mt-16 md:mt-28 mb-20">
          <div className="glass-card p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Want to Make a Difference?</h2>
            <p className="text-muted text-base md:text-lg max-w-2xl mx-auto mb-8">
              Join our volunteer team and help students around the world build better careers.
            </p>
            <Link to="/volunteer" className="btn-primary w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 inline-flex items-center justify-center gap-2 group">
              Become a Volunteer <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </BlurFade>
      </main>

      <Footer />
    </div>
  )
}
