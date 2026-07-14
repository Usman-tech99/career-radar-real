import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString) {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

export function formatCurrency(amount) {
  if (!amount) return 'Free'
  return `PKR ${amount.toLocaleString()}`
}

export function truncate(str, maxLength = 120) {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function getScoreColor(score) {
  if (score <= 30) return '#EF4444'   // red
  if (score <= 60) return '#F97316'   // orange
  if (score <= 80) return '#3B82F6'   // blue
  return '#F5A623'                     // gold
}

export function getScoreLabel(score) {
  if (score <= 30) return 'Developing'
  if (score <= 60) return 'Rising'
  if (score <= 80) return 'Advanced'
  return 'Expert'
}

export function getJobTypeBadgeClass(type) {
  const map = {
    'Full-time': 'badge-gold',
    'Part-time': 'badge-blue',
    'Internship': 'badge-purple',
    'Freelance': 'badge-gold',
    'Remote': 'badge-blue',
  }
  return map[type] || 'badge-blue'
}
