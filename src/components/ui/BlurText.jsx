import React from 'react'

export default function BlurText({ text, className = '', delay = 0 }) {
  return (
    <span 
      className={`inline-block animate-fade-in ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {text}
    </span>
  )
}
