# Cabrera Consulting Portal

Full-stack client portal. Next.js 14 + Supabase. Free deployment.

## Deploy (15 min)

### Step 1 — Supabase

1. Go to [supabase.com](https://supabase.com) → sign up → **New Project**
2. Name: `cabrera-portal` → set DB password → pick region → Create
3. Wait ~2 min, then go to **SQL Editor** → **New Query**
4. Open `supabase/schema.sql` from this repo → copy all → paste → **Run**
5. Go to **Authentication → Providers → Email** → turn OFF "Confirm email" → Save
6. Go to **Settings → API** → copy these 3 values:
   - Project URL
   - anon public key
   - service_role key

### Step 2 — Local Test (optional)

```bash
npm install
cp .env.local.example .env.local
# Paste your 3 Supabase keys into .env.local
npm run dev
# Open http://localhost:3000
```

### Step 3 — Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import your repo
3. Add these 3 **Environment Variables**:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | your service role key |

4. Click **Deploy** → live in ~60 seconds

### Step 4 — Verify

- Visit your Vercel URL → register an account → demo data auto-loads
- Check `/api/health` to verify DB connection

## Features

- 10 pages with full CRUD
- Real auth (register, login, password reset, session persistence)
- Password strength meter
- File uploads to Supabase Storage
- Rate limiting on auth routes
- Security headers (XSS, clickjacking, CORS)
- 3 themes (dark, light, midnight)
- Mobile responsive
- Works offline as standalone HTML file

## API: 19 routes, all authenticated

Auth: login, register, me, profile, password, reset
CRUD: inventory, billing, partners (list + create + get/update/delete by ID)
Files: documents (upload, list, delete)
Other: dashboard, notifications, seed, health

## Stack: $0/month

Next.js 14 + Supabase (free tier) + Vercel (free tier)
