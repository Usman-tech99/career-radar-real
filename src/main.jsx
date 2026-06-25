import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from "@sentry/react" // ✅ Imported safely
import App from './App.jsx'
import './index.css'

// 🔒 Safely initialize Sentry at the absolute start of the app lifecycle
Sentry.init({
  dsn: "https://a2e14a4af4ba7dd3ce33c52e41f7d175@o4511626386800640.ingest.de.sentry.io/4511626397483088",
  debug: true,            // 👈 Temporarily forces Sentry to log status in your browser console
  attachStacktrace: true, // 👈 Ensures the error details are sent immediately
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration()
  ],
  // Performance Tracing
  tracesSampleRate: 1.0, 
  tracePropagationTargets: ["localhost", /^https:\/\/career-radar-real\.vercel\.app/],
  
  // Visual Session Replays
  replaysSessionSampleRate: 1.0, 
  replaysOnErrorSampleRate: 1.0, 
  
  enableLogs: true
});

// ✅ Keeps your exact project DOM mounting setup intact without breaking
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)