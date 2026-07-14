import React from 'react'

export default function GradientText({ children, className = '', from = 'from-gold', to = 'to-amber-accent' }) {
  return (
    <span className={`bg-gradient-to-r ${from} ${to} bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  )
}
