import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import './index.css'

// Lazy-load Sentry after the initial render so it doesn't block the app
if (import.meta.env.PROD) {
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: "https://a2e14a4af4ba7dd3ce33c52e41f7d175@o4511626386800640.ingest.de.sentry.io/4511626397483088",
      debug: false,
      attachStacktrace: true,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration()
      ],
      tracesSampleRate: 0.3,
      tracePropagationTargets: ["localhost", /^https:\/\/career-radar-real\.vercel\.app/],
      replaysSessionSampleRate: 0.3,
      replaysOnErrorSampleRate: 0.5,
      enableLogs: false
    });
  });
}

// Global error handler — logs unhandled errors to DB and shows friendly UI
window.addEventListener('error', (e) => {
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
