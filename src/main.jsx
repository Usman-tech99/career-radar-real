import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import './index.css'

// Global error handler — skip logging in development
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
window.addEventListener('error', (e) => {
  if (isLocalhost) return
  fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/error_logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
    body: JSON.stringify({
      user_id: null,
      url: window.location.href,
      message: e.message || 'Unhandled error',
      stack: e.error?.stack || '',
      user_agent: navigator.userAgent,
    })
  }).catch(() => {})
})
window.addEventListener('unhandledrejection', (e) => {
  if (isLocalhost) return
  fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/error_logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
    body: JSON.stringify({
      user_id: null,
      url: window.location.href,
      message: e.reason?.message || 'Unhandled promise rejection',
      stack: e.reason?.stack || '',
      user_agent: navigator.userAgent,
    })
  }).catch(() => {})
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
      <Analytics />
    </HelmetProvider>
  </React.StrictMode>,
)
