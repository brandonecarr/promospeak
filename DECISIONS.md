# DECISIONS

Running log of meaningful tradeoffs, per §14 of the brief. Each entry: what we picked, what we rejected, why.

## 2026-05-14 — Brand: PromoSpeak
- Picked: PromoSpeak as the final name (not the EventSpeak placeholder).
- Centralized in `src/config/brand.ts` so swap costs are still one-file.

## 2026-05-14 — Payments: don't hold or route
- Picked: agencies pay ambassadors directly off-platform. No Stripe Connect, no escrow.
- Rejected: holding funds and routing payouts.
- Why: dodges money-transmitter licensing, 1099-NEC issuance, and dispute handling — buys ~4–6 weeks of MVP speed. Revisit V2.

## 2026-05-14 — Background checks: MVP scope, per-finalist
- Picked: Checkr integration in MVP. Agency-paid. Checks are run only on agency-selected finalists, configured per-job-requirement.
- Rejected: deferring to V2 (the brief's own recommendation) and running checks on every applicant.
- Why: the user has agencies asking for it now. Per-finalist keeps cost manageable for agencies. Flagged as the most-movable scope item if MVP slips.

## 2026-05-14 — Pricing handled via config + env
- Picked: tier definitions in `src/config/pricing.ts`, Stripe price IDs in env vars. Placeholder amounts.
- Why: lets us wire Stripe checkout now without committing to final numbers.

## 2026-05-14 — Forum: custom on Postgres (not Discourse)
- Picked: custom forum tables (`forum_categories`, `forum_threads`, `forum_posts`) under Supabase + RLS.
- Rejected: Discourse embed.
- Why: forum is the moat per §4.1, not a side feature. Custom keeps moderation UX, theming, and auth unified. Tradeoff: more code to maintain than an embed.

## 2026-05-14 — Stack: Next.js 16 + React 19 + Tailwind 4
- Brief specified Next.js 14+; we got 16.2.6 from `create-next-app` (current stable). React 19, Tailwind 4 (CSS-config), `@base-ui/react` via shadcn's `base-nova` preset.
- Why: forward-compatible with brief; no point pinning to older majors.

## 2026-05-14 — Drizzle queries + Supabase migrations
- Picked: Drizzle schema in `src/lib/db/schema.ts` is the source of truth for tables; `drizzle-kit generate` writes SQL into `supabase/migrations/`; Supabase CLI applies them.
- Rejected: ORM lock-in (no Prisma/etc), and using Drizzle migrations independently of Supabase tooling.
- Why: Drizzle gives typed queries; Supabase CLI gives branching, seed, and local Docker DB. Best of both. Manual migrations (RLS policies, triggers) use timestamp-prefixed filenames so they sort *after* Drizzle's numeric ones.

## 2026-05-14 — pgvector required from day one
- Picked: `CREATE EXTENSION IF NOT EXISTS vector;` prepended to `0000_init.sql`. `embedding vector(1536)` columns on `ambassadors` and `jobs`.
- Why: AI matching is Phase 2 but the column is cheap to add now and expensive to backfill later.

## 2026-05-14 — Routes: `/agency/` + `/talent/` + `/ps-admin`
- Picked: agency dashboard at `/agency/*`, ambassador dashboard at `/talent/*`, admin at `/ps-admin/*`. Public talent directory at `/ambassadors` (avoids URL collision with the dashboard).
- Rejected: brief's `/a/` + `/m/`; default `/admin`.
- Why: `/agency` + `/talent` reads better in URL bars and to non-internal users. `/ps-admin` is defense-in-depth on top of role-gated auth — the auth check is the boundary, the URL is just a speed bump for scanners.

## 2026-05-14 — RLS-on-by-default
- Picked: every public table is RLS-enabled at creation via `20260514120000_enable_rls.sql`. No policies added yet — policies land per vertical slice.
- Why: matches brief §10 ("RLS on every Supabase table"). Default-deny is the safe state; per-slice policies grant access as features ship.
