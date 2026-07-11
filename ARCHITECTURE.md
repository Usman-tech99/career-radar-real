# Career Radar — Platform Architecture

## Overview

Career Radar is a full-stack career development platform that connects students with jobs, scholarships, education resources, AI-powered career guidance, and a community ecosystem. It serves three user types: **public visitors**, **registered students**, and **admin staff** (with granular permission levels).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite 8 |
| **Styling** | Tailwind CSS + Framer Motion |
| **Backend / Database** | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| **AI Engine** | Groq Cloud (Llama 3.3 70B) via Edge Functions |
| **Forms** | React Hook Form + Zod |
| **Deployment** | Vercel (with prerendering for SEO) |
| **Error Tracking** | Sentry |
| **Analytics** | Vercel Analytics |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  Public  │  │  Auth    │  │  User    │  │  Admin Panel      │  │
│  │  Pages   │  │  Pages   │  │  Dashboard│  │  (CRUD + Stats)   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │             │             │                  │             │
│       └─────────────┼─────────────┼──────────────────┘             │
│                     │             │                                 │
│              ┌──────▼─────────────▼──────┐                         │
│              │    AuthContext            │                         │
│              │  (Role, Permissions,      │                         │
│              │   Session Management)     │                         │
│              └───────────┬──────────────┘                         │
│                          │                                          │
│              ┌───────────▼──────────────┐                         │
│              │    Supabase Client        │                         │
│              │    (JS SDK v2)           │                         │
│              └───────────┬──────────────┘                         │
└──────────────────────────┼─────────────────────────────────────────┘
                           │
                           │
┌──────────────────────────▼─────────────────────────────────────────┐
│                       SUPABASE                                      │
│                                                                     │
│  ┌─────────────┐  ┌─────────────────┐  ┌───────────────────────┐  │
│  │  Auth       │  │  PostgreSQL DB  │  │  Edge Functions       │  │
│  │  (Email/PW) │  │  (16+ tables)   │  │  (6 Deno TypeScript)  │  │
│  └─────────────┘  └────────┬────────┘  │                       │  │
│                            │            │  • generate-blueprint │  │
│                            │            │  • parse-resume       │  │
│  ┌─────────────┐           │            │  • radar-ai-chat      │  │
│  │  Storage    │           │            │  • recalculate-score  │  │
│  │  (avatars,  │           │            │  • create/delete-user │  │
│  │   products) │           │            └───────────┬───────────┘  │
│  └─────────────┘           │                        │              │
└────────────────────────────┼────────────────────────┼──────────────┘
                             │                        │
                    ┌────────▼────────┐     ┌─────────▼─────────┐
                    │    Groq API     │     │   External APIs   │
                    │  (Llama 3.3     │     │   (future:        │
                    │   70B model)    │     │    Stripe, etc.)  │
                    └─────────────────┘     └───────────────────┘
```

---

## 1. User Types & Access Control

| Role | Access | Permissions |
|---|---|---|
| **Public** | All public pages | No auth required |
| **Student** | Dashboard + AI features | After onboarding |
| **Collaborator** | My Profile only | Limited admin view |
| **Admin** | Assigned admin panels | Granular (9 permissions) |
| **Super Admin** | Full access | All panels + user management |

Permission system uses both **route guards** (`ProtectedRoute`) and **nav-level filtering** (`AdminLayout`) — each admin route requires a specific permission key (e.g., `manage_jobs`, `manage_products`).

---

## 2. Database Schema (16+ Tables)

| Table | Purpose |
|---|---|
| `user_roles` | Authorization & permissions |
| `public_users` / `profiles` | User profile data |
| `onboarding_data` | Student academic/goals data |
| `career_scores` | Career readiness scores |
| `career_blueprints` | AI-generated career plans |
| `resumes` | Saved resume data (JSONB) |
| `jobs` | Job listings |
| `scholarships` | Scholarship listings |
| `education_items` | Course/resource listings |
| `products` | Shop products |
| `weekly_content` | Blog/content posts |
| `socials` | Community/social links |
| `team_members` | Team member profiles |
| `site_stats` | Statistics singleton |
| `about_page` / `community_page` | CMS content |
| `delivered_orders` | Manual order tracking |
| `ai_chat_logs` | AI interaction history |

---

## 3. Edge Functions (AI & Admin)

Six serverless functions running on Supabase (Deno runtime):

### AI-Powered Functions (Groq Llama 3.3 70B)

| Function | What It Does |
|---|---|
| **generate-career-blueprint** | Takes user onboarding data + live jobs/courses/products → generates a structured career plan with gap analysis, recommended skills (linked to resources), action steps, and milestones |
| **parse-resume** | Extracts text from PDF/DOCX/TXT → sends to AI → returns structured JSON (education, experience, skills, projects, certifications) |
| **radar-ai-chat** | Conversational AI assistant that answers career questions, matches jobs, and provides guidance (supports English & Roman Urdu) |
| **recalculate-score** | Computes weighted career readiness score across 5 dimensions (Skills, Profile, Education, Experience, Activity) |

### Admin Functions

| Function | What It Does |
|---|---|
| **create-admin-user** | Super Admin creates admin/collaborator accounts |
| **delete-admin-user** | Super Admin deletes user accounts |

---

## 4. Key Flows

### Student Journey
```
Register → Onboarding (3-step wizard)
  → Dashboard (career score + active blueprint)
    → Blueprint (AI-generated career plan with clickable action steps)
    → Resume Builder (manual edit or AI import from PDF/DOCX/TXT)
    → Score (5-dimension breakdown with history chart)
    → Jobs / Scholarships / Education / Shop (embedded public pages)
```

### Admin Content Management
```
Admin Dashboard (stats overview)
  → Manage Jobs / Products / Education / Content / Scholarships
    → Full CRUD with form validation (react-hook-form + Zod)
    → File uploads to Supabase Storage
    → Instant publish/unpublish toggle
```

### Payment & Shop Flow
```
Product Listing (with FREE / Paid / WhatsApp-only modes)
  → Purchase Modal (shows price, bank details, WhatsApp number)
  → Customer sends payment manually
  → Super Admin confirms in Manage Payments
  → Generates signed URL for digital product delivery
```

### AI Blueprint Generation
```
User clicks "Generate Blueprint"
  → Edge Function fetches onboarding data + live jobs/courses/content/products
  → Sends structured prompt to Groq LLM
  → LLM returns JSON with gap_analysis, skills (with matched resources), action steps, milestones
  → Resources are server-side matched to courses/content/products by keyword
  → Blueprint saved to DB, displayed in dashboard
```

---

## 5. Key Features

- **AI Resume Import** — Upload PDF/DOCX/TXT, AI extracts and structures all fields
- **Career Blueprint** — AI generates personalized career plan with actionable steps
- **Smart Resource Matching** — Recommended skills automatically linked to available courses, articles, and products
- **Role-Based Admin** — Granular permissions for team management
- **Digital Products** — Manual payment flow with WhatsApp confirmation
- **SEO Optimized** — Prerendered static pages + meta tags + JSON-LD
- **Fully CMS-Driven** — About, Community, Site Stats, Team Members all editable via admin panel
- **Dark/Light Theme** — Persistent user preference
- **Multilingual AI** — Supports English and Roman Urdu

---

## 6. Deployment

- **Frontend**: Vercel (with prerendering for SEO)
- **Backend**: Supabase (hosted PostgreSQL + Edge Functions)
- **AI**: Groq Cloud
- **Domain**: career-radar.space
- **Error Monitoring**: Sentry
- **Analytics**: Vercel Analytics

---

## 7. Security

- Supabase Row Level Security (RLS) on all tables
- JWT verification on all Edge Functions
- Service role key restricted to Edge Functions only
- Route-level permission enforcement with 9 granular admin permissions
- Super Admin-only routes for sensitive operations
- Vercel Content Security Policy headers
