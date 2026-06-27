import logo from '../../assets/logo.png'

export default function BrandingPanel({ className = '' }) {
  return (
    <div className={`relative ${className}`}>
      {/* Outer ambient glow wash */}
      <div className="absolute -inset-8 bg-green/5 rounded-[48px] blur-3xl" />
      <div className="absolute -inset-4 bg-[#00FF66]/10 rounded-[40px] blur-3xl" />

      {/* Main panel — dark green-to-black gradient + neon border */}
      <div className="relative flex items-center gap-6 p-5 rounded-2xl border border-[#00FF66]/40 bg-gradient-to-br from-[#0a1f12] via-[#07110a] to-[#030503] shadow-[0_0_50px_-10px_rgba(0,255,102,0.25),inset_0_0_40px_-20px_rgba(0,255,102,0.1)]">

        {/* Extra neon glow ring around the entire panel */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-[#00FF66]/20 ring-offset-0" />
        <div className="absolute inset-0 rounded-2xl shadow-[0_0_60px_-12px_rgba(0,255,102,0.3),inset_0_0_50px_-20px_rgba(0,255,102,0.08)]" />

        {/* Badge with intense plasma aura */}
        <div className="relative shrink-0">
          {/* Plasma energy layers — outer chaotic glow */}
          <div className="absolute -inset-6 bg-[#00FF66]/10 rounded-full blur-[40px] animate-pulse" />
          <div className="absolute -inset-4 bg-[#00FF00]/20 rounded-full blur-[30px]" />
          <div className="absolute -inset-3 bg-[#00FF66]/30 rounded-full blur-[20px] mix-blend-screen" />

          {/* Sharp inner glow rings */}
          <div className="absolute -inset-2 rounded-full border border-[#00FF66]/50 shadow-[0_0_30px_8px_rgba(0,255,102,0.4),inset_0_0_20px_4px_rgba(0,255,102,0.2)]" />
          <div className="absolute -inset-1 rounded-full border border-[#00FF66]/30" />

          {/* Logo */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#00FF66]/10 to-transparent" />
          <img
            src={logo}
            alt="Career Radar"
            className="relative h-14 w-14 brightness-125 drop-shadow-[0_0_20px_rgba(0,255,102,0.8)_0_0_40px_rgba(0,255,102,0.4)]"
          />
        </div>

        {/* Text */}
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-sora font-bold tracking-tight">
            <span className="text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">Career</span>{' '}
            <span className="text-[#00FF66] drop-shadow-[0_0_20px_rgba(0,255,102,0.8)_0_0_40px_rgba(0,255,102,0.4)]">Radar</span>
          </h1>
          <p className="text-xs text-[#00FF66]/70 font-medium tracking-[0.2em] uppercase mt-1 drop-shadow-[0_0_8px_rgba(0,255,102,0.3)]">
            AI-Powered Career Intelligence
          </p>
        </div>

        {/* Corner neon accent dots */}
        <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.9)]" />
        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.9)]" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.9)]" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.9)]" />
      </div>
    </div>
  )
}