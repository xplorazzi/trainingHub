# TrainHub — Employee Training MVP

Video-based training modules with MCQ quizzes, scored feedback, and manager reporting. Built with Next.js, Supabase, and Prisma. Deploys to Netlify; Docker-ready for EC2.

## Features

- **Training catalog** — multiple modules with progress badges
- **Video → Quiz → Results** flow with stepper UX
- **Per-question review** with explanations and pass/fail threshold
- **Supabase Auth** with employee / manager / admin roles
- **Manager dashboard** with CSV export
- **Admin-lite** module editor
- **Completion certificate** (printable)
- **Demo login shortcuts** for stakeholder demos

## Quick start

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com/dashboard)
2. Enable **Email** auth provider
3. Add redirect URLs: `http://localhost:3000/**` and `https://*.netlify.app/**`
4. Copy API keys and database URLs from project settings

### 2. Environment

```bash
cp .env.example .env
# Fill in Supabase values
```

### 3. Database

```bash
npm install
npx prisma migrate dev
npm run db:seed
```

**Database URLs:** The app and seed use `DATABASE_URL` (port **6543**, transaction pooler) with `pgbouncer=true`. `DIRECT_URL` (port 5432) is only needed for `prisma migrate` if your network allows it.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Employee | `employee@demo.trainhub.local` | `demo1234` |
| Manager | `manager@demo.trainhub.local` | `demo1234` |
| Admin | `admin@demo.trainhub.local` | `demo1234` |

## Deploy to Netlify

Full step-by-step guide: [docs/NETLIFY_DEPLOY.md](docs/NETLIFY_DEPLOY.md)

**Short version:**

1. Push this repo to **GitHub**
2. [Netlify](https://app.netlify.com) → **Add new site** → import the repo
3. Copy all variables from `.env` into **Netlify → Environment variables**
4. In **Supabase → Authentication → URL Configuration**, add `https://*.netlify.app/**` to Redirect URLs
5. Deploy — wait for build to finish, then open your `https://….netlify.app` URL

## Admin — edit images and questions

1. Sign in as **Demo Admin** (`admin@demo.trainhub.local` / `demo1234`)
2. Open **Admin** in the top navigation (or `/admin/modules`)
3. For each module you can edit:
   - **Catalog thumbnail image URL** — direct link to an image (preview shown below the field)
   - **Video URL** — YouTube embed link
   - **MCQ questions** — click **Show & edit** under each module, then **Save module & questions**

**Image tips:** Paste a direct image URL (your CDN, Unsplash, etc.). Amazon product image links often block embedding — upload the image elsewhere or use a hosted copy.

**Question tips:** Options are separated with ` | ` (pipe). **Correct option index** is `0` for the first option, `1` for the second, etc.

## Docker (EC2-ready)

```bash
docker build -t trainhub .
docker run -p 3000:3000 --env-file .env trainhub
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed modules and demo users |

## Tech stack

- Next.js 16 (App Router)
- Tailwind CSS 4
- Supabase Auth + Postgres
- Prisma ORM
- Netlify (OpenNext adapter)
