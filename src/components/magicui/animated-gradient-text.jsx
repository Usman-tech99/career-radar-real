export function AnimatedGradientText({ children, className = '', speed = 1, colorFrom = '#00FF66', colorTo = '#60A5FA' }) {
  return (
    <span
      style={{
        '--bg-size': `${speed * 300}%`,
        '--color-from': colorFrom,
        '--color-to': colorTo,
      }}
      className={`animate-gradient inline bg-gradient-to-r from-[var(--color-from)] via-[var(--color-to)] to-[var(--color-from)] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent ${className}`}
    >
      {children}
    </span>
  )
}