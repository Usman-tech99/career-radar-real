import { launch } from 'puppeteer-core'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const distDir = path.resolve(root, 'dist')
const PORT = 4173

const ROUTES = [
  '/', '/about', '/team', '/jobs', '/scholarships',
  '/education', '/products', '/community', '/social',
  '/collaborators', '/donate', '/weekly-content', '/structure',
]

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

function findSystemChrome() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    process.env.CHROME_PATH,
  ].filter(Boolean)
  for (const p of paths) {
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
    server.listen(PORT, () => resolve(server))
  })
}

async function resolveChrome() {
  // On Windows, prefer system Chrome
  if (process.platform === 'win32') {
    const systemPath = findSystemChrome()
    if (systemPath) {
      console.log(`Using system Chrome at: ${systemPath}`)
      return systemPath
    }
  }

  // Try @sparticuz/chromium (works on Vercel/Linux, may also work locally)
  try {
    const chromium = await import('@sparticuz/chromium')
    const execPath = await chromium.default.executablePath()
    console.log('Using @sparticuz/chromium')
    return execPath
  } catch {
    // Fallback: try system Chrome on non-Windows
    const systemPath = findSystemChrome()
    if (systemPath) {
      console.log(`Using system Chrome at: ${systemPath}`)
      return systemPath
    }
  }

  return null
}

async function prerender() {
  const executablePath = await resolveChrome()
  if (!executablePath) {
    throw new Error('No Chrome/Chromium executable found. Install Chrome or @sparticuz/chromium.')
  }

  const launchOptions = {
    executablePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  }

  // Ensure dist is built
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.log('Building app...')
    const { spawn } = await import('child_process')
    await new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', 'build'], { cwd: root, stdio: 'inherit', shell: true })
      child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Build failed (code ${code})`)))
    })
  }

  const server = await startServer()
  const browser = await launch(launchOptions)
  const page = await browser.newPage()
  page.setDefaultTimeout(30000)
  await page.setViewport({ width: 1280, height: 800 })

  const prerendered = []

  for (const route of ROUTES) {
    const url = `http://localhost:${PORT}${route}`
    process.stdout.write(`\n  ${route}... `)

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})
      try {
        await page.waitForFunction(
          () => {
            const root = document.getElementById('root')
            if (!root) return false
            return (root.innerText || '').length > 50
          },
          { timeout: 10000 }
        )
      } catch {}
      await new Promise(r => setTimeout(r, 1500))

      let html = await page.content()
      html = html.replace(/https?:\/\/localhost:\d+/g, '')
      html = html.replace(/<link rel="modulepreload"[^>]*\/?>/g, '')

      const outputPath = route === '/'
        ? path.join(distDir, 'index.html')
        : path.join(distDir, route.slice(1), 'index.html')

      fs.mkdirSync(path.dirname(outputPath), { recursive: true })
      fs.writeFileSync(outputPath, html, 'utf-8')

      const kb = (html.length / 1024).toFixed(1)
      process.stdout.write(`✓ ${kb} KB`)
      prerendered.push(route)
    } catch (err) {
      process.stdout.write(`✗ ${err.message}`)
    }
  }

  await browser.close()
  server.close()

  console.log(`\n\n✓ Prerendered ${prerendered.length}/${ROUTES.length} routes`)
}

prerender().catch(err => {
  console.error('\nPrerendering failed:', err.message || err)
  console.log('⚠  Prerender skipped — SPA with meta tags still deployed')
  process.exit(0)
})
