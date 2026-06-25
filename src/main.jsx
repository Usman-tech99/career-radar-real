import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from "@sentry/react" // ✅ Imported Sentry SDK
import App from './App.jsx'
import './index.css'

// 🔒 Initialize Sentry at the absolute start of the lifecycle
Sentry.init({
  dsn: "https://a2e14a4af4ba7dd3ce33c52e41f7d175@o4511626386800640.ingest.de.sentry.io/4511626397483088",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration()
  ],
  // Performance Tracing
  tracesSampleRate: 1.0, // Capture 100% of transactions during development/debugging
  tracePropagationTargets: ["localhost", /^https:\/\/career-radar-real\.vercel\.app/],
  
  // Visual Session Replays (Crucial for watching why the dashboard froze)
  replaysSessionSampleRate: 1.0, // Set to 1.0 (100%) locally to catch all bugs immediately
  replaysOnErrorSampleRate: 1.0, // Capture the exact moment a black screen rendering occurs
  
  enableLogs: true
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)