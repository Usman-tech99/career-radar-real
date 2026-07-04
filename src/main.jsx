import React from 'react'
import ReactDOM from 'react-dom/client'
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
