import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const rateMap = new Map()
function rateLimit(key, max = 30, windowMs = 60000) {
  const now = Date.now()
  const entry = rateMap.get(key)
  if (!entry || now - entry.start > windowMs) {
    rateMap.set(key, { start: now, count: 1 })
    return { allowed: true }
  }
  entry.count++
  if (entry.count > max) {
    return { allowed: false, retryAfter: Math.ceil((entry.start + windowMs - now) / 1000) }
  }
  return { allowed: true }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown'
  const rl = rateLimit(ip, 60, 60000)
  if (!rl.allowed) {
    return res.status(429).json({ error: `Too many requests. Retry after ${rl.retryAfter}s` })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Support both raw storage paths (file + bucket) and full public URLs (url)
  if (req.query.file) {
    const bucket = req.query.bucket || 'product-files'
    const { data, error } = await supabase.storage.from(bucket).download(req.query.file)
    if (error || !data) {
      return res.status(404).json({ error: 'File not found' })
    }
    const buffer = Buffer.from(await data.arrayBuffer())
    const safeName = req.query.file.split('/').pop() || 'download'
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`)
    res.setHeader('Cache-Control', 'no-cache')
    return res.status(200).send(buffer)
  }

  if (req.query.url) {
    const allowedDomain = SUPABASE_URL.replace(/^https?:\/\//, '').split('/')[0]
    try {
      const parsed = new URL(req.query.url)
      if (!parsed.hostname.endsWith(allowedDomain)) {
        return res.status(403).json({ error: 'URL not allowed' })
      }
    } catch {
      return res.status(400).json({ error: 'Invalid URL' })
    }
    const fileRes = await fetch(req.query.url)
    if (!fileRes.ok) {
      return res.status(404).json({ error: 'File not found' })
    }
    const buffer = Buffer.from(await fileRes.arrayBuffer())
    const contentType = fileRes.headers.get('content-type') || 'application/pdf'
    const safeName = (req.query.filename) || 'download'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`)
    res.setHeader('Cache-Control', 'no-cache')
    return res.status(200).send(buffer)
  }

  return res.status(400).json({ error: 'Missing file or url parameter' })
}
