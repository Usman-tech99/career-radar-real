import { useState } from 'react'
import { ImageOff } from 'lucide-react'

const genericAlts = new Set(['avatar', 'thumbnail', 'logo', 'photo', 'image', 'picture', 'profile', 'preview', 'thumb'])

function extractInitials(alt) {
  if (!alt || typeof alt !== 'string') return ''
  const trimmed = alt.trim().toLowerCase()
  if (genericAlts.has(trimmed)) return ''
  return alt
    .split(/\s+/)
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function SafeImage({ src, alt, className = '', ...imgProps }) {
  const [failed, setFailed] = useState(!src)

  if (!src || failed) {
    const initials = extractInitials(alt)
    return (
      <div
        className={`${className} bg-gradient-to-br from-green/20 to-blue-accent/20 flex items-center justify-center overflow-hidden`}
        title={alt}
      >
        {initials ? (
          <span className="font-bold text-white/70 text-lg">{initials}</span>
        ) : (
          <ImageOff size={20} className="text-white/40" />
        )}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      {...imgProps}
    />
  )
}