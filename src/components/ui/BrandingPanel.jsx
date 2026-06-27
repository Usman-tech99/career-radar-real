import logo from '../../assets/logo.png'

export default function BrandingPanel({ className = '' }) {
  return (
    <div className={`relative ${className}`}>
      {/* Outer glow */}
      <div className="absolute -inset-4 bg-green/5 rounded-3xl blur-3xl" />
      <div className="absolute -inset-2 bg-green/10 rounded-[28px] blur-2xl" />

      {/* Main panel */}
      <div className="relative flex items-center gap-6 p-5 rounded-2xl border border-green/40 bg-[#0a1a12]/90 backdrop-blur-xl shadow-[0_0_40px_-8px_rgba(16,185,129,0.3),inset_0_1px_0_rgba(16,185,129,0.15)]">

        {/* Neon border glow */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-green/30 ring-offset-0" />
        <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_30px_-10px_rgba(16,185,129,0.15)]" />

        {/* Badge */}
        <div className="relative shrink-0">
          <div className="absolute -inset-2 bg-green/30 rounded-full blur-md" />
          <div className="absolute -inset-1 rounded-full border border-green/40" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green/10 to-transparent" />
          <img
            src={logo}
            alt="Career Radar"
            className="relative h-14 w-14 brightness-110 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
          />
        </div>

        {/* Text */}
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-sora font-bold tracking-tight">
            <span className="text-white">Career</span>{' '}
            <span className="text-green drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]">Radar</span>
          </h1>
          <p className="text-xs text-green/60 font-medium tracking-[0.2em] uppercase mt-1">
            AI-Powered Career Intelligence
          </p>
        </div>

        {/* Corner accent dots */}
        <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-green/60 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green/60 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-green/60 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-green/60 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
      </div>
    </div>
  )
}