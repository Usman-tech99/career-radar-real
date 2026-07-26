import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local')
}

function supabaseFetch(url, options) {
  const headers = new Headers(options?.headers || {})
  const anonKey = supabaseAnonKey || 'placeholder-key'
  if (!headers.has('apikey')) headers.set('apikey', anonKey)
  const auth = headers.get('Authorization') || headers.get('authorization') || ''
  if (auth === `Bearer ${anonKey}` || auth.startsWith('Bearer sb_')) {
    headers.delete('Authorization')
    headers.delete('authorization')
  }
  let requestUrl = url
  try {
    if (!url.includes('apikey=')) {
      const sep = url.includes('?') ? '&' : '?'
      requestUrl = url + sep + 'apikey=' + encodeURIComponent(anonKey)
    }
  } catch {}
  return fetch(requestUrl, { ...options, headers })
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    global: {
      fetch: supabaseFetch,
      headers: { apikey: supabaseAnonKey || 'placeholder-key' },
    },
  }
)
