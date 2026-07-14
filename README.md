# SalesPilot AI

AI Sales Employee for Indian SMBs — WhatsApp-native lead qualification, CRM, and automation.

## Status

This is a phased build. See `ARCHITECTURE.md` (in your first deliverable) for the full plan. Current progress:

- ✅ **Phase 1 — Project setup, database, auth**: Prisma schema, NextAuth (credentials + Google), signup/login/forgot-password/email verification flows, RBAC helper, multi-tenant org creation with a 14-day trial.
- ✅ **Phase 2 — Landing website**: all public pages (`/`, `/solutions`, `/industries`, `/pricing`, `/demo`, `/contact`), premium dark-glass design system, animated live-conversation hero.
- ✅ **Phase 3 — Dashboard shell**: sidebar navigation, topbar, stat cards, lead-growth and pipeline-funnel charts — wired to real database queries.
- ✅ **Phase 4 — CRM**: lead CRUD, drag-and-drop pipeline board (New → Contacted → Qualified → Meeting Scheduled → Won/Lost), notes, search/filter, new-lead form.
- ✅ **Phase 5 — AI Sales Agent**: provider-abstracted conversation engine (OpenAI + Anthropic), per-industry persona prompts, structured JSON extraction of name/budget/timeline/requirement/location from live conversation, keyword-based HOT/WARM/COLD scoring, agent settings UI (persona editor, temperature, on/off toggle).
- ✅ **Phase 6 — WhatsApp integration**: signed webhook receiver (HMAC-SHA256 verified), inbound message pipeline (dedupe → persist → AI reply → send), human takeover toggle, live inbox UI with manual reply, channel connection settings page.
- ✅ **Phase 7 — RAG Knowledge Base**: file upload (PDF/DOCX/TXT), URL scraping, and direct text entry; chunking with paragraph-aware overlap; OpenAI embeddings stored via pgvector; cosine-similarity retrieval with a relevance threshold so irrelevant chunks don't get passed to the AI as false context; polling UI showing PENDING → PROCESSING → READY/FAILED per document.
- ✅ **Phase 8 — Automation Engine**: visual workflow builder (trigger + ordered steps: assign to least-loaded rep, update status, send WhatsApp message, wait N hours), execution engine that runs steps synchronously until a WAIT step, then schedules resumption via a `WorkflowRun` row picked up by a Vercel Cron job every 15 minutes.
- ⏳ **Phases 9–10** (deeper analytics, billing): not yet built.

## Phase 8 notes

- **Triggers wired in**: `LEAD_CREATED` fires from both manual lead creation (`lead.service.ts`) and the AI agent auto-creating a lead from a WhatsApp conversation. `LEAD_STATUS_CHANGED` fires from any status update (CRM drag-and-drop included). `LEAD_SCORE_HOT` fires the moment a lead's score crosses into HOT for the first time — not on every message, just the transition.
- **WAIT steps need the cron job running** to ever resume — locally, nothing calls `/api/cron/run-followups` unless you hit it manually or run `vercel dev` with cron emulation. On Vercel, `vercel.json` schedules it every 15 minutes automatically once deployed. Set a `CRON_SECRET` env var if you want the endpoint to reject unauthorized calls (Vercel sends it automatically on scheduled invocations).
- **Assignment is "least-loaded", not literal round robin** — it assigns to whichever active rep currently has the fewest open (non-WON/LOST) leads. Functionally equivalent for fairness, but self-corrects if someone's on leave instead of blindly cycling through a fixed order.
- **Message templates** support `{{name}}`, `{{requirement}}`, `{{location}}` placeholders pulled from the lead at send time.

## Phase 7 notes

- **Embeddings always use OpenAI**, even if `AI_PROVIDER=anthropic` for chat — Anthropic has no embeddings endpoint. Set `OPENAI_API_KEY` either way if you want the knowledge base to work.
- **Run `prisma/post-migrate.sql` once** after your first migration — it adds the pgvector IVFFlat index Prisma's schema can't express. Without it, retrieval still works, just without an index (fine for a demo, slow past a few thousand chunks).
- **Processing is synchronous-but-non-blocking**: the upload route returns immediately with a `PENDING` document, then extraction/embedding runs in the background on the same server process (not awaited by the route handler). Same caveat as WhatsApp in Phase 6 — no retry queue yet, so a failed extraction just sits at `FAILED` until re-uploaded.
- **Relevance threshold**: `rag.service.ts` only returns chunks under a cosine-distance threshold of 0.45, so an unrelated question returns no context (and the AI is instructed to say it'll check with the team) instead of confidently answering from the closest-but-irrelevant chunk it could find.

## Phase 5–6 notes

- **AI reply loop**: `lib/services/ai-agent.service.ts` builds a system prompt from the org's persona + any knowledge-base context, sends it with conversation history, and expects strict JSON back (`{ reply, extracted, handoff }`). If the model doesn't return valid JSON, it fails safe with a generic reply and flags the conversation for human handoff rather than risking a broken message reaching a real customer.
- **Scoring is deterministic, not another LLM call** (`lib/ai/scoring.ts`) — it reads the `timeline` text the agent already extracted and matches it against day/month thresholds, so a lead's HOT/WARM/COLD score is always explainable by looking at that one field.
- **WhatsApp processing is currently synchronous** (webhook → process → reply, inline in the request). The architecture doc called for Inngest background jobs here; I deferred that because it needs its own account/keys you haven't set up yet. It'll matter once message volume is real — for now it works correctly, just without retry/backoff on failures.
- **To actually connect WhatsApp**: go to `/settings` in the app, paste your Phone Number ID and WABA ID from Meta for Developers, and register the webhook URL shown there in Meta's dashboard along with your `WHATSAPP_VERIFY_TOKEN`.

## Local setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start Postgres locally** (or point `DATABASE_URL` at a hosted instance like Neon/Supabase — Supabase is recommended since it also gives you `pgvector` for the knowledge base):
   ```bash
   docker compose up -d
   ```

3. **Copy environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in `DATABASE_URL` at minimum to run the app. Other keys (OpenAI, WhatsApp, Razorpay, Resend) are only required once their respective phases are wired up — the app will run without them, those features just won't work yet.

4. **Run the database migration**
   ```bash
   npx prisma migrate dev --name init
   ```
   Note: the `Embedding` model uses `pgvector`. If your Postgres instance doesn't have the extension enabled, run `CREATE EXTENSION IF NOT EXISTS vector;` before migrating, or comment out the `Embedding` model until Phase 7.

5. **Seed a demo organization (optional)**
   ```bash
   npm run prisma:seed
   ```
   Creates "Sunrise Realty" with login `owner@sunriserealty.demo` / `Password123`.

6. **Run the dev server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

## Environment variables

See `.env.example` for the full list, grouped by service. Nothing is hardcoded — every external integration reads from `process.env`.

## Project structure

See `ARCHITECTURE.md` from the first deliverable for the full folder structure and database schema reference. Short version:

- `src/app/(marketing)` — public site
- `src/app/(auth)` — signup/login/password flows
- `src/app/(app)` — authenticated dashboard (org-scoped)
- `src/app/api` — route handlers, including webhooks
- `src/lib/services` — business logic (nothing outside this layer talks to Prisma or external SDKs directly)
- `src/lib/integrations` — thin SDK wrappers (Resend, and later OpenAI/Anthropic, WhatsApp, Razorpay, S3)
- `src/lib/ai` — provider abstraction and per-industry system prompts
- `prisma/schema.prisma` — full multi-tenant schema

## Deployment

Target: Vercel for the app, a managed Postgres (Neon/Supabase) for the database. A `Dockerfile` is included for self-hosting or CI if you'd rather not use Vercel.

## What's next

Say the word and I'll continue with **Phase 7 (RAG Knowledge Base)** — document upload, text extraction, chunking, pgvector embeddings, and swapping the current plain-text search in `rag.service.ts` for real similarity search.
