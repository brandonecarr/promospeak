# PromoSpeak

A modern recreation of EventSpeak.com — a two-sided marketplace and industry community for experiential / promotional marketing. Agencies post gigs, brand ambassadors apply, and the forum is where the industry hangs out.

See [`EventSpeak rebuild prompt.md`](./EventSpeak%20rebuild%20prompt.md) for the full product brief and [`DECISIONS.md`](./DECISIONS.md) for the running record of architectural decisions.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind 4** + **shadcn/ui** (Base UI primitives via `base-nova` preset)
- **Supabase** (Postgres, Auth, Storage, Realtime)
- **Drizzle ORM** (typed queries) + Supabase CLI (migrations + local dev DB)
- **Stripe** (agency subscriptions; no payment routing — agencies pay ambassadors directly)
- **Checkr** (background checks; agency-paid, per-finalist)
- **Resend** + **React Email**
- **pgvector** for AI matching embeddings (Phase 2)

## Project layout

```
src/
├── app/
│   ├── (marketing)/      /, /pricing, /about, /contact, /insights
│   ├── (public)/         /jobs, /ambassadors, /forum  (read-only public)
│   ├── (auth)/           /login, /signup
│   ├── agency/           Agency dashboard
│   ├── talent/           Ambassador dashboard
│   ├── ps-admin/         Admin (defense-in-depth on top of role-gate)
│   └── api/              Webhooks (Stripe, Checkr, Resend) + iCal feed
├── components/ui/        shadcn primitives
├── components/shared/    Cross-surface components
├── config/               brand.ts | site.ts | pricing.ts | env.ts
├── lib/
│   ├── supabase/         client | server | admin | middleware
│   ├── db/               Drizzle schema + client
│   ├── stripe/  resend/  checkr/  auth/  ai/  validations/
├── server/actions/       Server actions (mutations)
├── server/queries/       Read-only data fetchers
├── emails/               React Email templates
└── types/database.ts     Generated from Supabase
supabase/
├── migrations/           0000_init (Drizzle) + timestamped manual SQL
└── seed.sql              Forum categories
```

## Getting started

```bash
# 1. Install deps
pnpm install

# 2. Copy env and fill in values
cp .env.example .env.local

# 3. Start local Supabase (requires Docker Desktop running)
pnpm supabase:start

# 4. Apply schema + seed
pnpm exec supabase db reset

# 5. Generate Supabase TypeScript types
pnpm db:types

# 6. Run the app
pnpm dev          # http://localhost:3000

# 7. Preview emails (optional)
pnpm email:dev    # http://localhost:3001
```

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Run Next.js in dev |
| `pnpm build` / `pnpm start` | Production build + serve |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest unit/integration tests |
| `pnpm db:generate` | Drizzle migration from schema diff |
| `pnpm db:push` | Apply Drizzle schema directly to DB (skip migrations) |
| `pnpm db:studio` | Drizzle's web GUI |
| `pnpm db:types` | Regenerate `src/types/database.ts` from Supabase |
| `pnpm supabase:start` / `stop` / `status` | Local Supabase via Docker |
| `pnpm email:dev` | Preview React Email templates |

## Phased plan

Per §9 of the brief:

- **Phase 1 (MVP, 6–8 weeks):** auth, profiles, job posting, applications, basic messaging, Stripe subscriptions, forum, Stripe Identity, Checkr background checks (per-finalist).
- **Phase 2:** AI matching (pgvector + OpenAI embeddings), two-way reviews, video portfolios, calendar sync, forum reactions, public "State of Experiential" dashboard.
- **Phase 3:** native iOS/Android (Expo), GPS check-in, advanced analytics, Enterprise API, multi-region.

Build in vertical slices. First slice: **agency signup → create agency → post first job → see it on `/jobs`**.
