import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local')
}

function supabaseFetch(url, options) {
  const headers = { ...(options?.headers || {}) }
  const anonKey = supabaseAnonKey || 'placeholder-key'
  headers['apikey'] = anonKey
  const auth = headers.Authorization || headers.authorization || ''
  if (auth === `Bearer ${anonKey}` || auth.startsWith('Bearer sb_')) {
    delete headers.Authorization
    delete headers.authorization
  }
  return fetch(url, { ...options, headers })
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
