import React from 'react'

export default function GradientText({ children, className = '', from = 'from-green', to = 'to-blue-accent' }) {
  return (
    <span className={`bg-gradient-to-r ${from} ${to} bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  )
}
