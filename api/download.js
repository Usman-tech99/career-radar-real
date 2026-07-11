import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const filename = req.query.file
  if (!filename) {
    return res.status(400).json({ error: 'Missing file parameter' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data, error } = await supabase.storage.from('product-files').download(filename)

  if (error || !data) {
    return res.status(404).json({ error: 'File not found' })
  }

  const buffer = Buffer.from(await data.arrayBuffer())
  const safeName = filename.split('/').pop() || 'download'

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`)
  res.setHeader('Cache-Control', 'no-cache')
  res.status(200).send(buffer)
}
