# Career Radar — Technical Architecture Report

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DNS: career-radar.space                            │
│                   (Cloudflare / Vercel Nameservers)                         │
└──────────────────────────┬──────────────────────────────────────────────────┘
                           │
                    ┌──────▼──────────────────────────────────────────────────┐
                    │              Vercel (Hosting & Edge Network)            │
                    │                                                         │
                    │  ┌──────────────────────────────────────────────────┐   │
                    │  │  Static Assets (CDN)                            │   │
                    │  │  ┌───────────┐ ┌──────────┐ ┌───────────────┐  │   │
                    │  │  │ React SPA │ │ Prerendered HTML│ │ Static files │  │   │
                    │  │  └───────────┘ └──────────┘ └───────────────┘  │   │
                    │  └──────────────────────────────────────────────────┘   │
                    │                                                         │
                    │  ┌──────────────────────────────────────────────────┐   │
                    │  │  Serverless Functions (/api/*)                   │   │
                    │  │  ┌────────────────┐                             │   │
                    │  │  │  /api/download  │  File download proxy       │   │
                    │  │  └────────────────┘                             │   │
                    │  └──────────────────────────────────────────────────┘   │
                    └──────────────────────────┬──────────────────────────────┘
                                               │
          ┌────────────────────────────────────┼────────────────────────────────────┐
          │                                    │                                    │
          ▼                                    ▼                                    ▼
┌──────────────────────┐          ┌──────────────────────────┐       ┌─────────────────────┐
│    Supabase Project  │          │   Third-Party APIs        │       │    Sentry (Optional) │
│   (gxjapdlpuzonrbmqjyei)      │                          │       │                     │
│                      │          │  ┌────────────────────┐   │       │  Error Tracking     │
│  ┌────────────────┐  │          │  │  Groq AI API       │   │       └─────────────────────┘
│  │ PostgreSQL DB   │  │          │  │  (LLM for resume   │   │
│  │ (23 tables)     │  │          │  │  parsing, career   │   │
│  └────────────────┘  │          │  │  blueprints)       │   │
│                      │          │  └────────────────────┘   │
│  ┌────────────────┐  │          │  ┌────────────────────┐   │
│  │ Storage Buckets │  │          │  │  Resend API        │   │
│  │ (8 buckets)     │  │          │  │  (Email delivery   │   │
│  └────────────────┘  │          │  │  for volunteer     │   │
│                      │          │  │  notifications)    │   │
│  ┌────────────────┐  │          │  └────────────────────┘   │
│  │ Auth (Built-in) │  │          │  ┌────────────────────┐   │
│  │ (Supabase Auth) │  │          │  │  Google OAuth      │   │
│  └────────────────┘  │          │  │  (Social login)    │   │
│                      │          │  └────────────────────┘   │
│  ┌────────────────┐  │          └──────────────────────────┘
│  │ Edge Functions  │  │
│  │ (5 functions)   │  │
│  └────────────────┘  │
└──────────────────────┘
```

---

## 2. Frontend Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 18 + Vite 8 | SPA with fast HMR, optimized builds |
| **Routing** | react-router-dom v6 | Client-side routing, protected routes, lazy loading |
| **Styling** | Tailwind CSS 3 + PostCSS | Utility-first CSS, custom design system |
| **Animation** | Framer Motion, Three.js + React Three Fiber | Page transitions, 3D RadarCursor, particle effects |
| **Forms** | react-hook-form + Zod | Validation, schema-driven forms |
| **State** | React Context (AuthContext, ThemeContext) | Global auth state, theme management |
| **HTTP** | Supabase JS Client, fetch | Database queries, Storage, Edge Functions |
| **SEO** | react-helmet-async | Per-page meta tags, Open Graph |
| **Toasts** | react-hot-toast | User notifications |
| **Deployment** | Vercel (CDN, SPA routing, prerendering) | Static asset delivery, pre-rendered pages |

### Key Frontend Pages

**Public:**
- `/` — Home (hero, stats, features, testimonials, founder video)
- `/jobs` — Job listings (filtered by category)
- `/scholarships` — Scholarship listings
- `/education` — AI tools / learning resources
- `/products` — Digital products shop (free + paid)
- `/weekly-content` — Resource packs, guides, roadmaps
- `/volunteer` — Volunteer registration form
- `/team`, `/about`, `/community`, `/social`, `/collaborators` — Content pages

**Auth:**
- `/login`, `/register`, `/onboarding`, `/forgot-password`, `/reset-password`

**User Dashboard:**
- `/dashboard` — Personalized home, AI blueprint, career score
- `/dashboard/blueprint` — AI-generated career roadmap
- `/dashboard/resume` — AI-powered resume builder
- `/dashboard/score` — Career readiness score

**Admin Panel:**
- `/admin/dashboard`, `/admin/manage-*` — 15+ admin CRUD pages
- `/admin/error-logs` — Error monitoring
- `/admin/manage-volunteers` — Volunteer application management

---

## 3. Backend: Supabase

### 3.1 PostgreSQL Database (23 tables)

| Table | Purpose |
|-------|---------|
| `profiles` | Auth profile mapping (role, avatar, meta) |
| `public_users` | Extended user data collected during onboarding |
| `user_roles` | Role-based access control (super_admin, admin, collaborator, user) |
| `jobs` | Scholarship/Internship/Job listings |
| `scholarships` | Scholarship opportunities |
| `education_items` | AI tools, courses, learning resources |
| `products` | Digital products (free/paid, with file delivery) |
| `weekly_content` | Resource packs, guides, roadmaps |
| `career_blueprints` | AI-generated career roadmaps per user |
| `career_scores` | Career readiness scores per user |
| `resumes` | AI-parsed resume data |
| `onboarding_data` | User onboarding state tracking |
| `volunteers` | Volunteer applications (40+ fields) |
| `error_logs` | Global client-side error logging |
| `collaborators` | Partner organizations |
| `team_members` | Team directory |
| `socials` | Social media links |
| `site_stats` | Community statistics counters |
| `delivered_orders` | Paid product delivery tracking |
| `community_page` | Community page content |
| `about_page` | About page content |
| `structure_page` | Mission/vision content |
| `ai_chat_logs` | AI chat conversation history |

### 3.2 Storage Buckets (8)

| Bucket | Visibility | Content |
|--------|-----------|---------|
| `product-files` | **PRIVATE** | Paid product PDFs/files (accessed via Vercel proxy with service_role) |
| `product-thumbnails` | Public | Product thumbnail images |
| `content-files` | Public | Weekly content files, guides, PDFs |
| `avatars` | Public | User profile avatars |
| `team-avatars` | Public | Team member photos |
| `education-thumbnails` | Public | Course/resource thumbnails |
| `scholarship-logos` | Public | Scholarship provider logos |
| `collaborator-logos` | Public | Partner organization logos |

### 3.3 Supabase Edge Functions (5)

| Function | Trigger | Purpose | JWT? |
|----------|---------|---------|------|
| `radar-ai-chat` | User chat in Radar AI Bubble | AI conversation assistant | ✅ Required |
| `generate-career-blueprint` | User requests career roadmap | Generates AI blueprint with resource matching | ✅ Required |
| `parse-resume` | Resume upload (Dashboard) | Extracts resume data via Groq AI | ✅ Required |
| `send-volunteer-email` | Volunteer form submission | Notifies admin via Resend email | ❌ Public |
| `download-product` | *(Supabase fallback)* | Signed URL generation (Vercel proxy is primary) | ❌ Public |

### 3.4 Auth & Security

- **Supabase Auth** — Email/password, Google OAuth, magic links
- **Row Level Security (RLS)** — Per-table policies for public reads, authenticated writes, admin-only mutations
- **Role-based access** — `user_roles` table: `super_admin`, `admin`, `collaborator`, `user`
- **Storage RLS** — Private buckets require service_role (via Vercel proxy) or signed URLs

---

## 4. Vercel Layer

### 4.1 Hosting

- **Domain**: `career-radar.space` (custom domain on Vercel)
- **Framework Preset**: Vite
- **Build Command**: `npm run build:prerender` — builds SPA + prerenders key pages for SEO
- **Output**: Static files served from Vercel CDN (global edge network)
- **Rewrite**: All routes to `index.html` (SPA catch-all; API routes auto-prioritized)

### 4.2 Serverless Function

| Endpoint | Method | Purpose | Env Vars Used |
|----------|--------|---------|---------------|
| `/api/download?file=` | GET | Proxies file downloads from private `product-files` bucket | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `/api/download?url=` | GET | Proxies file downloads from public buckets (content-files, etc.) | *(none needed)* |

### 4.3 Security Headers (vercel.json)

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | Restricts scripts, fonts, images, connections to approved origins only |
| `X-Frame-Options` | `DENY` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Permissions-Policy` | Blocks camera, microphone, geolocation |

---

## 5. Third-Party Integrations

| Service | Usage | Auth Method |
|---------|-------|-------------|
| **Supabase** | Database, Auth, Storage, Edge Functions | Anon key (public) + Service role (server-side) |
| **Groq AI** | Resume parsing, career blueprint generation, AI chat | API key (server-side) |
| **Resend** | Transactional emails (volunteer notifications) | API key (server-side) |
| **Google OAuth** | Social login (`signInWithOAuth`) | Supabase provider config |
| **Sentry** | Error tracking (optional, currently configured) | DSN (client-side) |

---

## 6. Data Flow Diagrams

### 6.1 Public Page Load

```
Browser -> GET https://career-radar.space/ -> Vercel Edge
                                                  |
                                                  +-- Static file? --> CDN cache -> Browser
                                                  |
                                                  +-- SPA route? --> index.html -> React SPA loads
                                                                                    |
                                                                                    v
                                                                          +---------------------+
                                                                          |  React App boots    |
                                                                          |  AuthContext checks  |
                                                                          |  session via         |
                                                                          |  supabase.auth       |
                                                                          +----------+----------+
                                                                                    |
                                                                                    v
                                                                          +---------------------+
                                                                          |  Component renders  |
                                                                          |  Calls Supabase     |
                                                                          |  .from('table')     |
                                                                          |  .select()          |
                                                                          |  (anon key, RLS     |
                                                                          |   enforced)         |
                                                                          +---------------------+
```

### 6.2 File Download (Product PDF)

```
User clicks "Download" (Free product)
         |
         v
Shop.jsx --window.open('/api/download?file=<storage-path>')--> Vercel (same origin)
                                                                       |
                                                                       v
                                                              api/download.js
                                                                       |
                                                         +--------------+--------------+
                                                         |  Creates Supabase admin     |
                                                         |  client (service_role key)  |
                                                         |                             |
                                                         |  supabase.storage           |
                                                         |    .from('product-files')    |
                                                         |    .download(path)          |
                                                         +--------------+--------------+
                                                                        |
                                                                        v
                                                              Returns file as response
                                                              Content-Disposition: inline
                                                                        |
                                                                        v
                                                              PDF opens in browser tab
```

### 6.3 AI Career Blueprint Generation

```
User clicks "Generate Blueprint"
         |
         v
Blueprint.jsx --POST--> Supabase Edge Function
                         generate-career-blueprint
                              |
                    +----------+-----------+
                    |  Fetches user data   |
                    |  from:               |
                    |  - public_users      |
                    |  - career_scores     |
                    |  - onboarding_data   |
                    +----------+-----------+
                              |
                              v
                    +-----------------------+
                    |  Calls Groq API       |
                    |  (Llama model)        |
                    |  5-step prompt:       |
                    |  1. Profile analysis  |
                    |  2. Skill extraction  |
                    |  3. Gap analysis      |
                    |  4. Action steps      |
                    |  5. Job recommendations|
                    +-----------+-----------+
                              |
                              v
                    +-----------------------+
                    |  Fetches resources:   |
                    |  - education_items    |
                    |  - weekly_content     |
                    |  - products           |
                    |  Matches skills ->    |
                    |  attaches resources   |
                    +-----------+-----------+
                              |
                              v
                    +-----------------------+
                    |  Fetches jobs by ID   |
                    |  (inline fetch from   |
                    |   frontend)           |
                    |                       |
                    |  Saves gap_analysis   |
                    |  + action_steps to    |
                    |  career_blueprints    |
                    +-----------------------+
```

---

## 7. Deployment & CI/CD

| Step | Description |
|------|-------------|
| **Code Hosting** | GitHub (`github.com/Usman-tech99/career-radar-real`) |
| **Deployment** | Vercel auto-deploys from `main` branch on each push |
| **Build** | `npm run build:prerender` -> `vite build` + `node scripts/prerender.mjs` |
| **Edge Functions** | `npx supabase functions deploy <name>` (manual via CLI) |
| **DB Migrations** | SQL files in `supabase/migrations/` — run manually in Supabase SQL Editor |
| **Env Variables** | Vercel: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server-side only); `.env.local` for `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (client-safe) |

---

## 8. Environment Variables

### Client-side (`.env.local` / Vercel Build Env)
| Variable | Source |
|----------|--------|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon/Public Key |

### Server-side (Vercel, never in client bundle)
| Variable | Source |
|----------|--------|
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (full admin privileges) |

### Supabase Secrets (Edge Functions)
| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | Sending volunteer emails |
| `NOTIFY_EMAIL` | Admin notification email address |
| `GROQ_API_KEY` | AI LLM API access |
| `GEMINI_API_KEY` | Secondary AI provider |

---

## 9. Security Architecture

```
+------------------------------------------------------------------+
|                         Security Layers                          |
+------------------------------------------------------------------+
| 1. Vercel Edge: CSP, HSTS, X-Frame-Options, etc. (vercel.json)  |
| 2. Supabase RLS: Row-level policies on all 23 tables             |
| 3. Supabase Auth: JWT-based authentication                       |
| 4. Storage RLS: Bucket-level SELECT/INSERT/UPDATE/DELETE policies|
| 5. Service Role: Only used in Vercel serverless functions        |
|    (never exposed to client)                                     |
| 6. Anon Key: Public-safe, restricted by RLS                      |
| 7. API Keys (Groq, Resend): Stored server-side only             |
+------------------------------------------------------------------+
```

---

## 10. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Vercel proxy for file downloads** instead of direct Supabase URLs | Hides Supabase storage URL from users; allows private bucket delivery without signed URLs |
| **Edge Functions for AI processing** | Server-side API key protection; no LLM keys exposed to client |
| **Prerendering** for key pages | Improves SEO for public-facing pages (Home, Jobs, etc.) |
| **Split env variables** (VITE_ vs server-only) | `VITE_*` vars bundled with client; `SUPABASE_SERVICE_ROLE_KEY` stays server-side only |
| **Private `product-files` bucket** | Paid product files not directly accessible; controlled via Vercel proxy with service_role |
| **Public content buckets** | Free resources need direct public URL access for simplicity |
| **Multi-AI provider** | Groq for primary LLM + Gemini as fallback/redundancy |

---

*Report generated July 2026. Career Radar Platform v1.0.0*
