# SalesPilot AI — Architecture & Implementation Plan

**AI Sales Employee for Indian SMBs**

This document covers Phase 0 of the build: architecture, folder structure, database schema, and the implementation plan. No application code is written yet — this is the blueprint we'll execute against phase by phase.

---

## 1. System Architecture

### 1.1 High-Level Overview

```
                                   ┌─────────────────────────┐
                                   │   Vercel Edge Network    │
                                   │  (Next.js 15 App Router) │
                                   └────────────┬─────────────┘
                                                │
              ┌─────────────────────────────────┼─────────────────────────────────┐
              │                                 │                                 │
   ┌──────────▼──────────┐         ┌────────────▼────────────┐        ┌──────────▼──────────┐
   │  Marketing Site      │         │   Authenticated App      │        │   API Routes /       │
   │  (/,/pricing,/demo…) │         │   (Dashboard, CRM, etc.) │        │   Route Handlers      │
   │  Static + ISR        │         │   Protected by NextAuth  │        │   (REST + Webhooks)   │
   └──────────────────────┘         └───────────────────────────┘       └──────────┬────────────┘
                                                                                     │
                        ┌────────────────────────────────────────────────────────────┼───────────────────────────┐
                        │                                                            │                           │
             ┌──────────▼──────────┐                                    ┌────────────▼────────────┐   ┌──────────▼──────────┐
             │   PostgreSQL (RDS/  │                                    │   Service Layer           │   │  Background Jobs     │
             │   Supabase/Neon)    │◄───────────────────────────────────┤   (lib/services/*)        │   │  (Inngest / Trigger.dev)│
             │   via Prisma ORM    │                                    │  - AIAgentService          │   │  - Follow-up cron      │
             └──────────────────────┘                                    │  - WhatsAppService         │   │  - Lead scoring         │
                                                                          │  - RAGService              │   │  - Embedding jobs       │
                        ┌─────────────────────────────────────────────┐  │  - BillingService          │   └──────────────────────┘
                        │                                             │  │  - NotificationService     │
             ┌──────────▼──────────┐   ┌──────────────────┐  ┌────────▼──┴─────────────┐  ┌──────────────────┐
             │  Vector DB           │   │  Object Storage   │  │  External APIs           │  │  Payments          │
             │  (Supabase pgvector) │   │  (S3-compatible)   │  │  - OpenAI/Anthropic       │  │  Razorpay          │
             └──────────────────────┘   └──────────────────┘  │  - WhatsApp Cloud API     │  └──────────────────┘
                                                                │  - Resend (email)         │
                                                                └───────────────────────────┘
```

### 1.2 Architectural Principles

- **Multi-tenancy**: single database, row-level isolation via `organizationId` on every tenant-scoped table, enforced through a Prisma middleware/extension so no query can accidentally cross tenants.
- **Clean/hexagonal layering**: routes/UI never call Prisma or external SDKs directly — they call a `service` in `lib/services/`, which owns business logic and talks to `lib/integrations/` (thin SDK wrappers) and `lib/repositories/` (Prisma access).
- **Type safety end-to-end**: Prisma-generated types → Zod schemas for API validation → shared types package consumed by frontend. No `any`.
- **AI provider abstraction**: `lib/ai/provider.ts` defines a common interface (`generateResponse`, `embedText`) with `OpenAIProvider` and `AnthropicProvider` implementations, selected via env var — nothing else in the codebase imports `openai` or `@anthropic-ai/sdk` directly.
- **Async by default for anything slow**: embedding generation, WhatsApp fan-out, follow-up scheduling run as background jobs, not inline in request handlers.
- **Idempotent webhooks**: WhatsApp/Razorpay webhook handlers dedupe on provider event ID before processing.

### 1.3 Request Flow Example — Inbound WhatsApp Message

```
WhatsApp Cloud API
      │  webhook POST
      ▼
/api/webhooks/whatsapp  (verifies signature, dedupes, 200s immediately)
      │  enqueues job
      ▼
Inngest function: process-inbound-message
      │
      ├─► ConversationService.appendMessage()
      ├─► RAGService.retrieveContext(orgId, message)
      ├─► AIAgentService.generateReply(context, conversationHistory)
      ├─► LeadService.updateScoreIfNeeded()
      └─► WhatsAppService.sendMessage(reply)  ──► WhatsApp Cloud API
```

---

## 2. Tech Stack (confirmed)

| Layer | Choice |
|---|---|
| Frontend framework | Next.js 15 (App Router), React 19, TypeScript strict mode |
| Styling | Tailwind CSS + Shadcn UI (Radix primitives) + Framer Motion |
| Backend | Next.js Route Handlers (`app/api/**`) — single deployable, no separate service for MVP |
| Database | PostgreSQL (Neon or Supabase for pooled serverless connections) |
| ORM | Prisma |
| Auth | Auth.js (NextAuth v5) — credentials + Google OAuth, JWT session strategy |
| Storage | S3-compatible (AWS S3 or Cloudflare R2) |
| Vector store | Supabase pgvector (same Postgres instance — avoids a second vendor for MVP; Pinecone documented as swap-in) |
| AI | Provider-abstracted: OpenAI (`gpt-4o` chat, `text-embedding-3-small`) primary, Anthropic-compatible interface for swap-in |
| Payments | Razorpay Subscriptions |
| Messaging | WhatsApp Business Cloud API (Meta) |
| Email | Resend |
| Background jobs | Inngest (serverless-friendly, works on Vercel without a persistent worker) |
| Deployment | Vercel (app) + managed Postgres |
| Testing | Vitest (unit/API), React Testing Library (components), Playwright (e2e, later phase) |

---

## 3. Folder Structure

```
salespilot-ai/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (marketing)/                 # public site, its own layout
│   │   │   ├── page.tsx                 # /
│   │   │   ├── solutions/page.tsx
│   │   │   ├── industries/[slug]/page.tsx
│   │   │   ├── pricing/page.tsx
│   │   │   ├── demo/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── verify-email/page.tsx
│   │   ├── (app)/                       # authenticated dashboard, org-scoped
│   │   │   ├── layout.tsx               # sidebar shell, org/session guard
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── inbox/page.tsx
│   │   │   ├── leads/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [leadId]/page.tsx
│   │   │   ├── ai-agent/page.tsx
│   │   │   ├── knowledge-base/page.tsx
│   │   │   ├── automation/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── billing/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── webhooks/
│   │       │   ├── whatsapp/route.ts
│   │       │   └── razorpay/route.ts
│   │       ├── leads/route.ts
│   │       ├── leads/[id]/route.ts
│   │       ├── conversations/route.ts
│   │       ├── knowledge/upload/route.ts
│   │       ├── ai-agent/config/route.ts
│   │       ├── automation/workflows/route.ts
│   │       ├── analytics/route.ts
│   │       └── billing/checkout/route.ts
│   ├── components/
│   │   ├── ui/                          # shadcn primitives
│   │   ├── marketing/
│   │   ├── dashboard/
│   │   ├── crm/
│   │   ├── inbox/
│   │   └── charts/
│   ├── lib/
│   │   ├── services/                    # business logic
│   │   │   ├── ai-agent.service.ts
│   │   │   ├── conversation.service.ts
│   │   │   ├── lead.service.ts
│   │   │   ├── rag.service.ts
│   │   │   ├── whatsapp.service.ts
│   │   │   ├── billing.service.ts
│   │   │   ├── automation.service.ts
│   │   │   └── analytics.service.ts
│   │   ├── repositories/                # Prisma queries, org-scoped
│   │   ├── integrations/
│   │   │   ├── openai.client.ts
│   │   │   ├── anthropic.client.ts
│   │   │   ├── whatsapp.client.ts
│   │   │   ├── razorpay.client.ts
│   │   │   ├── resend.client.ts
│   │   │   └── s3.client.ts
│   │   ├── ai/
│   │   │   ├── provider.ts              # common interface
│   │   │   ├── prompts/                 # system prompts per industry
│   │   │   └── scoring.ts               # hot/warm/cold logic
│   │   ├── validation/                  # Zod schemas
│   │   ├── auth/                        # NextAuth config, RBAC helpers
│   │   ├── db.ts                        # Prisma client singleton
│   │   └── utils.ts
│   ├── jobs/                            # Inngest functions
│   │   ├── process-inbound-message.ts
│   │   ├── generate-embeddings.ts
│   │   ├── follow-up-scheduler.ts
│   │   └── lead-scoring.ts
│   ├── types/
│   └── config/
│       └── industries/                  # per-industry template config
│           ├── real-estate.ts
│           ├── coaching.ts
│           ├── clinics.ts
│           ├── automobile.ts
│           ├── travel.ts
│           └── insurance.ts
├── tests/
│   ├── unit/
│   ├── api/
│   └── components/
├── docker-compose.yml                   # local Postgres for dev
├── Dockerfile
├── .env.example
└── README.md
```

---

## 4. Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── Identity & Tenancy ────────────────────────────────────────────

model User {
  id            String       @id @default(cuid())
  name          String?
  email         String       @unique
  emailVerified DateTime?
  passwordHash  String?
  image         String?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  memberships   Membership[]
  assignedLeads Lead[]       @relation("AssignedEmployee")

  @@index([email])
}

model Organization {
  id            String        @id @default(cuid())
  name          String
  slug          String        @unique
  industry      Industry
  phone         String?
  city          String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  memberships       Membership[]
  leads             Lead[]
  customers         Customer[]
  conversations     Conversation[]
  aiAgent           AIAgent?
  knowledgeDocs     KnowledgeDocument[]
  workflows         Workflow[]
  appointments      Appointment[]
  analyticsEvents   AnalyticsEvent[]
  subscription      Subscription?
  invoices          Invoice[]
  whatsappChannel   Channel?
}

enum Industry {
  REAL_ESTATE
  COACHING
  CLINIC
  AUTOMOBILE
  TRAVEL
  INSURANCE
  OTHER
}

model Membership {
  id             String       @id @default(cuid())
  userId         String
  organizationId String
  role           Role
  createdAt      DateTime     @default(now())

  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([userId, organizationId])
  @@index([organizationId])
}

enum Role {
  OWNER
  SALES_MANAGER
  SALES_EMPLOYEE
}

// ── Billing ───────────────────────────────────────────────────────

model Subscription {
  id                  String       @id @default(cuid())
  organizationId      String       @unique
  organization        Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  plan                Plan
  status               SubStatus
  razorpaySubId        String?     @unique
  currentPeriodEnd     DateTime?
  createdAt            DateTime    @default(now())
  updatedAt            DateTime    @updatedAt
}

enum Plan {
  STARTER
  GROWTH
  ENTERPRISE
}

enum SubStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
}

model Invoice {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  razorpayInvoiceId String?
  amount         Int          // in paise
  status         String
  issuedAt       DateTime     @default(now())

  @@index([organizationId])
}

// ── CRM ───────────────────────────────────────────────────────────

model Lead {
  id              String       @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  customerId      String?
  customer        Customer?    @relation(fields: [customerId], references: [id])

  name            String
  phone           String
  email           String?
  source          LeadSource
  budget          String?
  location        String?
  requirement     String?
  timeline        String?
  status          LeadStatus   @default(NEW)
  score           LeadScore    @default(COLD)
  assignedToId    String?
  assignedTo      User?        @relation("AssignedEmployee", fields: [assignedToId], references: [id])

  notes           Note[]
  appointments    Appointment[]
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([organizationId, status])
  @@index([organizationId, score])
}

enum LeadSource {
  WHATSAPP
  WEBSITE
  MANUAL
  REFERRAL
  ADS
}

enum LeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  MEETING_SCHEDULED
  WON
  LOST
}

enum LeadScore {
  HOT
  WARM
  COLD
}

model Note {
  id        String   @id @default(cuid())
  leadId    String
  lead      Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  authorId  String?
  content   String
  createdAt DateTime @default(now())
}

model Customer {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  name           String?
  phone          String
  email          String?
  leads          Lead[]
  conversations  Conversation[]
  createdAt      DateTime     @default(now())

  @@unique([organizationId, phone])
}

// ── Messaging ─────────────────────────────────────────────────────

model Channel {
  id                    String       @id @default(cuid())
  organizationId        String       @unique
  organization          Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  whatsappPhoneNumberId String?
  whatsappWabaId        String?
  accessTokenRef        String?      // reference to secret, never store raw token
  status                String       @default("PENDING")
}

model Conversation {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  customerId     String
  customer       Customer     @relation(fields: [customerId], references: [id])
  assignedToId   String?
  mode           ConvMode     @default(AI)
  messages       Message[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@index([organizationId, updatedAt])
}

enum ConvMode {
  AI
  HUMAN
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         SenderType
  content        String
  metadata       Json?
  createdAt      DateTime     @default(now())

  @@index([conversationId, createdAt])
}

enum SenderType {
  CUSTOMER
  AI
  EMPLOYEE
}

// ── AI Agent & Knowledge Base ────────────────────────────────────

model AIAgent {
  id              String       @id @default(cuid())
  organizationId  String       @unique
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  name            String       @default("SalesPilot AI")
  personaPrompt   String       @db.Text
  temperature     Float        @default(0.4)
  model           String       @default("gpt-4o")
  isActive        Boolean      @default(true)
  updatedAt       DateTime     @updatedAt
}

model KnowledgeDocument {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  title          String
  sourceType     SourceType
  sourceUrl      String?
  storageKey     String?      // S3 key for uploaded file
  status         DocStatus    @default(PENDING)
  chunks         Embedding[]
  createdAt      DateTime     @default(now())
}

enum SourceType {
  PDF
  DOCX
  URL
  IMAGE
  TEXT
}

enum DocStatus {
  PENDING
  PROCESSING
  READY
  FAILED
}

model Embedding {
  id                  String            @id @default(cuid())
  documentId          String
  document            KnowledgeDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)
  chunkText           String            @db.Text
  vector              Unsupported("vector(1536)")
  createdAt           DateTime          @default(now())

  @@index([documentId])
}

// ── Automation ────────────────────────────────────────────────────

model Workflow {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  name           String
  trigger        String       // e.g. "NEW_LEAD"
  definition     Json         // ordered steps
  isActive       Boolean      @default(true)
  createdAt      DateTime     @default(now())
}

model Appointment {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  leadId         String
  lead           Lead         @relation(fields: [leadId], references: [id], onDelete: Cascade)
  scheduledAt    DateTime
  status         String       @default("SCHEDULED")
  notes          String?
  createdAt      DateTime     @default(now())
}

// ── Analytics ─────────────────────────────────────────────────────

model AnalyticsEvent {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  type           String       // e.g. "LEAD_CREATED", "CONVERSATION_STARTED"
  payload        Json?
  createdAt      DateTime     @default(now())

  @@index([organizationId, type, createdAt])
}
```

**Notes:**
- `Embedding.vector` uses `Unsupported("vector(1536)")` — requires the `pgvector` extension enabled on the Postgres instance; a raw SQL migration will add the extension and an IVFFlat/HNSW index.
- Every tenant-scoped model carries `organizationId` and is accessed only through repository functions that require an org context — enforced by a Prisma Client Extension in `lib/db.ts` rather than trusted to each call site.
- Secrets (WhatsApp tokens, etc.) are stored as references to a secrets manager, not raw values in the DB.

---

## 5. Environment Variables

```bash
# Database
DATABASE_URL=

# Auth
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI
AI_PROVIDER=openai            # openai | anthropic
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Vector DB
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
# (or, if using Pinecone instead)
PINECONE_API_KEY=
PINECONE_INDEX=

# Storage
S3_ENDPOINT=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=

# WhatsApp Business Cloud API
WHATSAPP_APP_ID=
WHATSAPP_APP_SECRET=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

# Email
RESEND_API_KEY=

# Payments
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Background jobs
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

---

## 6. Implementation Plan (Build Order)

| Phase | Deliverable | Key files |
|---|---|---|
| 1 | Project setup, Prisma schema + migration, NextAuth config, org/role model, RBAC middleware | `prisma/schema.prisma`, `lib/auth/*`, `middleware.ts` |
| 2 | Marketing site — all public pages, SEO metadata, demo conversation widget | `app/(marketing)/**` |
| 3 | Dashboard shell — sidebar, layout, cards, charts (mocked data first, wired after CRM exists) | `app/(app)/dashboard`, `components/dashboard/**` |
| 4 | CRM — Lead CRUD, pipeline board, assignment, notes, filters | `app/(app)/leads/**`, `lib/services/lead.service.ts` |
| 5 | AI Sales Agent — provider abstraction, system prompts per industry, conversation engine, lead-scoring logic | `lib/ai/**`, `lib/services/ai-agent.service.ts` |
| 6 | WhatsApp integration — webhook receiver, send/receive, human takeover toggle | `app/api/webhooks/whatsapp`, `lib/integrations/whatsapp.client.ts` |
| 7 | RAG knowledge base — upload pipeline, extraction, embeddings, retrieval | `app/api/knowledge/upload`, `lib/services/rag.service.ts`, `jobs/generate-embeddings.ts` |
| 8 | Automation engine — workflow builder UI + execution engine | `app/(app)/automation`, `lib/services/automation.service.ts` |
| 9 | Analytics — event tracking, dashboards, funnels | `lib/services/analytics.service.ts`, `components/charts/**` |
| 10 | Billing — Razorpay subscription checkout, webhook, invoices, usage limits | `app/api/billing/**`, `lib/integrations/razorpay.client.ts` |

Each phase, once built, will come with: a summary of what was created, the files touched, setup/env instructions specific to that phase, and what's still outstanding before the next phase starts.

---

## 7. Open Decisions to Confirm Before Phase 1

1. **Vector store**: Supabase pgvector (single Postgres instance, simpler ops) vs. Pinecone (separate managed service, better at scale). Plan above defaults to pgvector for MVP — confirm or override.
2. **Backend split**: Next.js API routes only (as planned) vs. a separate Node/Express service for the AI agent + WhatsApp workloads (better isolation, more infra to run). Plan above defaults to API routes.
3. **Repo shape**: single Next.js app (as laid out above) vs. a monorepo (Turborepo) splitting `web`, `api`, `jobs` into packages. Defaults to single app for faster MVP velocity.

If you don't have a preference, I'll proceed with the defaults stated above.

---

**Status: Phase 0 complete. Waiting for your go-ahead to start Phase 1 (project setup, database, auth).**
