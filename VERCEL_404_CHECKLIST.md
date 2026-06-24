# Vercel Deployment 404 Error Checklist

## ✅ Pre-Deployment Verification

### Local Build Test
```bash
npm run build          # Should complete without errors
npm run preview        # Should serve without 404s
```

### Check Build Output
```bash
ls -la dist/           # Should contain:
                       # - index.html
                       # - logo.svg
                       # - assets/ (with CSS & JS files)
```

## 🚀 Vercel Deployment Configuration

### 1. Environment Variables in Vercel
Go to **Project Settings → Environment Variables** and add:

```
VITE_SUPABASE_URL = https://gxjapdlpuzonrbmqjyei.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**IMPORTANT**: Vercel needs `VITE_` prefix to expose to frontend!

### 2. Build Settings
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci` (or `npm install`)

### 3. Check Deployment Logs
In Vercel Dashboard:
1. Go to **Deployments** tab
2. Click latest deployment
3. Click **Logs** tab
4. Look for:
   - ❌ Build errors
   - ❌ Missing dependencies
   - ✅ Successful build message

## 🔍 Debugging 404 Errors

### On Your Deployed Site

**Method 1: Browser Console**
```javascript
// Open DevTools (F12) → Console
// Paste this to find all failed resources:
Array.from(document.querySelectorAll('img, script, link')).forEach(el => {
  if (el.src && el.src.includes('404')) console.log('BROKEN:', el.src);
  if (el.href && el.href.includes('404')) console.log('BROKEN:', el.href);
});
```

**Method 2: Network Tab (BEST)**
1. Open DevTools (F12)
2. Click **Network** tab
3. Press Ctrl+Shift+R (hard refresh)
4. Look for **red rows** with status 404
5. Click each one and note the URL

### Common 404 Scenarios

| Error | Cause | Fix |
|-------|-------|-----|
| `/logo.png 404` | Wrong favicon file | Change to `/logo.svg` ✅ DONE |
| Supabase image 404 | Storage is private/no CORS | Enable public access & CORS in Supabase |
| API endpoint 404 | Edge Function not deployed | Deploy Supabase functions |
| JS/CSS 404 | Build failed silently | Check Vercel build logs |
| Dynamic image 404 | Broken URL in database | Check database for correct image URLs |

## 🛠️ Fixes to Apply

### If CSS or JS is 404:
Your build failed. Check Vercel logs for:
- Missing `node_modules`
- Syntax errors
- Missing dependencies

### If Supabase images are 404:
1. Go to Supabase Dashboard
2. Storage → Your bucket
3. Make sure files are **PUBLIC**
4. Enable **CORS** with your Vercel domain

### If API endpoints are 404:
1. Go to Supabase Edge Functions
2. Check if functions exist:
   - `radar-ai-chat`
   - `recalculate-score`
   - `create-admin-user`
   - `delete-admin-user`
3. Redeploy if needed: `supabase functions deploy`

### If favicon is 404:
✅ Already fixed! Just redeploy.

## 📊 What The Network Tab Should Show

**Good (✅ 200 status):**
- `index.html` - 1.11 kB
- `index-BOPEZeOV.css` - ~40 kB
- `index-DFyn3JZY.js` - ~780 kB
- `logo.svg` - favicon

**Bad (❌ 404 status):**
- Any red entries = resources that failed to load

## 🚨 If Still Getting 404s After Fixes

1. **Verify environment variables are set in Vercel** ← Most common!
2. **Check build logs** - errors during build
3. **Force redeploy** - sometimes Vercel cache issues
4. **Check file case sensitivity** - Linux is case-sensitive!
   - `Logo.svg` ≠ `logo.svg`
   - `Index.html` ≠ `index.html`

## 📱 Test Checklist

After deploying to Vercel:
- [ ] Home page loads without errors
- [ ] Browser favicon shows (not broken)
- [ ] No red errors in Console tab
- [ ] No red rows in Network tab
- [ ] Images load correctly
- [ ] Navigation works
- [ ] Login page loads

---

**Questions?** Check the browser Network tab - it will tell you exactly what's missing!
