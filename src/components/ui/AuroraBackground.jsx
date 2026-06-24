import React from 'react'

export default function AuroraBackground({ children, className = '' }) {
  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Aurora Background Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green/30 rounded-full blur-[120px] animate-aurora opacity-50" />
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-accent/30 rounded-full blur-[120px] animate-aurora opacity-50 animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-purple-accent/30 rounded-full blur-[120px] animate-aurora opacity-50 animation-delay-4000" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
