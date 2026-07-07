import { launch } from 'puppeteer-core'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const distDir = path.resolve(root, 'dist')
const PORT = 4173

const ROUTES = [
  '/', '/about', '/team', '/jobs', '/scholarships',
  '/education', '/products', '/community', '/social',
  '/collaborators', '/donate', '/weekly-content', '/structure',
]

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  process.env.CHROME_PATH,
].filter(Boolean)

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.json': 'application/json',
}

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p
  }
  // Try common macOS/Linux paths
  const unixPaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ]
  for (const p of unixPaths) {
    if (fs.existsSync(p)) return p
  }
  return null
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url.split('?')[0])
      if (!fs.existsSync(filePath)) {
        const dirIndex = path.join(filePath, 'index.html')
        if (fs.existsSync(dirIndex)) {
          filePath = dirIndex
        } else {
          filePath = path.join(distDir, 'index.html')
        }
      }
      const stat = fs.statSync(filePath, { throwIfNoEntry: false })
      if (!stat || stat.isDirectory()) {
        filePath = path.join(distDir, 'index.html')
      }
      const ext = path.extname(filePath)
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' })
      fs.createReadStream(filePath).pipe(res)
    })
    server.listen(PORT, () => {
      console.log(`Static server running on http://localhost:${PORT}`)
      resolve(server)
    })
  })
}

async function prerender() {
  const chromePath = findChrome()
  if (!chromePath) {
    console.error('Chrome not found. Install Chrome or set CHROME_PATH env var.')
    process.exit(1)
  }
  console.log(`Using Chrome at: ${chromePath}`)

  // Ensure dist is built
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.log('Building app...')
    await new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', 'build'], { cwd: root, stdio: 'inherit', shell: true })
      child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Build failed with exit code ${code}`)))
    })
  }

  // Start static server
  const server = await startServer()

  // Launch browser
  const browser = await launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  })

  const page = await browser.newPage()
  page.setDefaultTimeout(30000)

  // Set reasonable viewport
  await page.setViewport({ width: 1280, height: 800 })

  const prerendered = []

  for (const route of ROUTES) {
    const url = `http://localhost:${PORT}${route}`
    console.log(`\nPrerendering: ${route}`)

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})
      // Wait for main content to appear (anything meaningful beyond the shell)
      try {
        await page.waitForFunction(
          () => {
            const root = document.getElementById('root')
            if (!root) return false
            const text = root.innerText || ''
            // Check that we have more than just a spinner or empty state
            return text.length > 50 && !text.includes('Just a moment')
          },
          { timeout: 10000 }
        )
      } catch {}
      // Extra settle time for animations
      await new Promise(r => setTimeout(r, 1500))

      let html = await page.content()

      // Fix absolute localhost URLs back to relative paths
      html = html.replace(/https?:\/\/localhost:\d+/g, '')
      // Remove duplicate meta description (the one without data-rh)
      html = html.replace(/\n\s*<meta name="description" content="[^"]*"\/?>\s*\n/g, '\n')

      // Determine output path
      const outputPath = route === '/'
        ? path.join(distDir, 'index.html')
        : path.join(distDir, route.slice(1), 'index.html')

      fs.mkdirSync(path.dirname(outputPath), { recursive: true })
      fs.writeFileSync(outputPath, html, 'utf-8')

      console.log(`  ✓ Saved to ${path.relative(root, outputPath)} (${(html.length / 1024).toFixed(1)} KB)`)
      prerendered.push(route)
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`)
    }
  }

  await browser.close()
  server.close()

  console.log(`\n✓ Prerendered ${prerendered.length}/${ROUTES.length} routes`)
  return prerendered
}

prerender().catch(err => {
  console.error('Prerendering failed:', err)
  process.exit(1)
})
