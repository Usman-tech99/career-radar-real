import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
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
