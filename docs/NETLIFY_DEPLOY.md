# Deploy TrainHub on Netlify

## Before you deploy

1. Database migrations are already applied on Supabase (you ran `prisma migrate` locally).
2. Demo users and modules exist (`npm run db:seed`).

## Step 1 — Push code to GitHub

```bash
git add .
git commit -m "Prepare for Netlify deploy"
git push origin main
```

## Step 2 — Create Netlify site

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. **Add new site** → **Import an existing project**
3. Choose **GitHub** and select `raja_mcq_demo`
4. Netlify should detect **Next.js** automatically.

Build settings (should match `netlify.toml`):

| Setting | Value |
|---------|--------|
| Build command | `npx prisma generate && npm run build` |
| Publish directory | Leave default (Netlify Next.js adapter handles this) |
| Node version | 20 |

## Step 3 — Environment variables

In Netlify: **Site configuration** → **Environment variables** → **Add a variable**

Add **every** variable from your local `.env`:

| Variable | Netlify scope | Notes |
|----------|---------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Build** (not “Secret”) | Public — safe in client bundle |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Build** (not “Secret”) | Public anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Server-only |
| `DATABASE_URL` | **Secret** | Port **6543** + `pgbouncer=true` |
| `DIRECT_URL` | Secret (optional) | Migrations only |

**Important:** Do **not** mark `NEXT_PUBLIC_*` variables as “Secret” in Netlify — they are meant to appear in the browser. Only service role and database URLs should be secrets. `netlify.toml` also sets `SECRETS_SCAN_OMIT_KEYS` for public Supabase vars.

Apply to **Production** and **Deploy Previews**.

## Step 4 — Supabase auth URLs

In Supabase → **Authentication** → **URL Configuration**:

1. **Site URL:** `https://YOUR-SITE.netlify.app` (update after first deploy)
2. **Redirect URLs** — add:

```
http://localhost:3000/**
https://YOUR-SITE.netlify.app/**
https://*.netlify.app/**
```

## Step 5 — Deploy

Click **Deploy site** (or push to GitHub to trigger auto-deploy).

First build may take 2–5 minutes. When it succeeds, open the Netlify URL.

## Step 6 — Smoke test

1. Catalog shows all modules
2. Sign in as **Demo Admin** (`admin@demo.trainhub.local` / `demo1234`)
3. Complete a quiz and check results
4. Manager dashboard loads for manager account

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails on Prisma | Ensure `DATABASE_URL` is set in Netlify env vars |
| Login redirects fail | Add your Netlify URL to Supabase redirect URLs |
| Database errors at runtime | Use pooled `DATABASE_URL` (6543), not direct 5432 |
| Quiz results 404 on Netlify | Set `DATABASE_URL` to Supabase **transaction pooler** (6543); redeploy after env change |
| Images don’t load | Use direct image URLs; add host to `next.config.ts` `images.remotePatterns` |
| Secrets scan fails on `NEXT_PUBLIC_*` | Mark those vars as **Build** not **Secret** in Netlify; or rely on `SECRETS_SCAN_OMIT_KEYS` in `netlify.toml` |
| `@opentelemetry/api` edge error | Fixed via dependency in `package.json` — redeploy after pulling latest |

## Custom domain (optional)

Netlify → **Domain management** → add your domain → update Supabase Site URL and redirect URLs to match.
