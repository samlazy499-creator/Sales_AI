# Deploy SalesPilot AI to Vercel — copy-paste guide

Total time: ~15 minutes. You need a free GitHub account, a free Supabase account, and a free Vercel account.

---

## Step 1 — Push the code to GitHub

1. Go to github.com → **New repository** → name it `salespilot-ai` → Create (leave it empty, no README).
2. In your terminal, inside the unzipped `salespilot-ai` folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/salespilot-ai.git
git push -u origin main
```

---

## Step 2 — Create the database (Supabase)

1. Go to supabase.com → **New project**.
2. Pick a region close to India (e.g. Mumbai/`ap-south-1` if offered, otherwise Singapore).
3. Once it's created, go to **Project Settings → Database → Connection string → URI**. Copy it — this is your `DATABASE_URL`. It looks like:
   ```
   postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-xxxx.pooler.supabase.com:6543/postgres
   ```
4. Go to the **SQL Editor** in Supabase and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
   This enables the knowledge-base feature's vector search (Phase 7, later).

---

## Step 3 — Generate a NEXTAUTH_SECRET

Run this locally and save the output:

```bash
openssl rand -base64 32
```

(No `openssl`? Use `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` instead.)

---

## Step 4 — Import into Vercel

1. Go to vercel.com → **Add New → Project** → import your `salespilot-ai` GitHub repo.
2. It auto-detects Next.js — leave build settings as-is (the included `vercel.json` handles running `prisma generate`).
3. Before clicking Deploy, expand **Environment Variables** and add:

| Key | Value |
|---|---|
| `DATABASE_URL` | from Step 2 |
| `NEXTAUTH_URL` | `https://your-project-name.vercel.app` (you can see/guess this before deploying, or update it after the first deploy and redeploy) |
| `NEXTAUTH_SECRET` | from Step 3 |
| `NEXT_PUBLIC_APP_URL` | same as `NEXTAUTH_URL` |

4. Click **Deploy**. First build takes ~2-3 minutes.

---

## Step 5 — Run the database migration

The database is empty until you run the migration once. From your machine:

```bash
DATABASE_URL="paste-your-supabase-url-here" npx prisma migrate deploy
```

(Run this from inside the project folder, after `npm install`.)

---

## Step 6 — Visit your live site

Go to `https://your-project-name.vercel.app` — the landing page, signup, and login should all work. Sign up, verify your email (see note below), and you'll land on the dashboard.

**Note on email verification:** account emails won't actually send until you add a `RESEND_API_KEY` (free tier at resend.com, takes 2 minutes to grab). Without it, signups will succeed but the verification email step will silently fail. Add `RESEND_API_KEY` to Vercel's env vars and redeploy once you have one, or ask me to add a "skip verification in dev" flag if you want to test before setting that up.

---

## After this

Google login, WhatsApp, AI replies, and billing all need their own API keys (Google Cloud Console, Meta for Developers, OpenAI, Razorpay) — the app runs and the dashboard/CRM work fully without them. Add those as we build out Phases 5–10, or whenever you're ready to wire a specific one in.

---

## If you'd rather I just walk you through it live

Tell me your Vercel project's URL once step 4 is done and I'll help you debug anything that comes up.
