# Build Prompt: EventSpeak Reborn — A Modern Marketplace + Community for Experiential Marketing

> Paste this entire document as the initial brief for an AI coding agent (Claude Code, Cursor, Replit Agent, etc.). Treat every `[CONFIGURE]` token as a value to confirm with me before you write code that depends on it.

---

## 1. Project Context

You are building a modern recreation of **EventSpeak.com** — a platform founded in 2006 by James Trivlis that served as a clearinghouse where experiential/promotional marketing agencies posted event-staffing gigs, brand ambassadors created profiles and applied to them, and the whole industry hung out in an active forum to swap stories and trends. The original site is effectively defunct, but the industry it served is bigger than ever: experiential marketing budgets are growing, mega-events (World Cup, Olympics, festival circuits, retail activations) demand thousands of brand ambassadors per activation, and the existing platforms are fragmented, dated, or agency-owned walled gardens.

We are rebuilding EventSpeak with **every piece of the original's functionality preserved** (agency accounts, ambassador profiles, job postings, applications, industry forum, trend data) and then layering on the modern conveniences the original never had (verified profiles, in-app messaging, AI matching, ratings, calendar sync, rich media portfolios).

**Working brand name:** `[CONFIGURE]` — placeholder is **"EventSpeak"**. Final name TBD; build a `brand` config object so every label, logo path, and email sender can be swapped in one place.

**Geographic scope (V1):** United States only. Architect for internationalization (i18n-ready strings, currency-agnostic money handling in cents, country-aware tax forms) but ship US-only first.

---

## 2. Product Vision

A two-sided marketplace + community where:

- **Agencies** post promotional gigs they were hired to staff, find vetted brand ambassadors fast, manage the entire lifecycle of a booking (application → confirm → check-in → pay → review) in one place, and tap into an industry forum that builds their network.
- **Brand ambassadors** build a single portfolio that travels with them across every agency relationship, find work that fits their schedule and location, get paid reliably, build a verifiable reputation, and connect with peers.
- **The platform** earns recurring revenue from agency subscriptions while keeping the platform free for ambassadors — the same accessibility that made the original EventSpeak the de facto hangout for the industry.

The original's superpower was being **the** gathering place, not a transactional silo. Preserve that culture. The forum is not a side feature.

---

## 3. User Personas

### 3.1 Agency (paying customer)
Promotional marketing companies, experiential agencies, mobile tour operators, guerrilla marketing shops, trade show staffing firms. Range from 2-person shops to enterprise agencies staffing hundreds per week.

### 3.2 Brand Ambassador (the talent)
Promotional models, event staff, demonstrators, sampling teams, trade show booth staff, street team members, mascots, hosts, multilingual specialists. Skews 20s–40s, gig-economy mindset, mobile-first, often working multiple agencies simultaneously.

### 3.3 Platform Admin
Operator/moderator. Needs tools to review verifications, moderate forum, handle disputes, manage subscriptions, view platform analytics.

---

## 4. Core Functional Requirements

### 4.1 Preserve from the original EventSpeak

- **Agency accounts** with company profile, logo, description, locations served, contact info.
- **Ambassador profiles** — the centerpiece. Photo, bio, location, work history, skills, languages, sizes (apparel for uniform fitting), age range visible to agencies, transportation availability.
- **Job postings** with date(s), location, role type (sampling, demo, host, street team, etc.), pay rate, dress code, requirements.
- **Applications** — ambassadors apply, agencies review and confirm.
- **Industry forum** — categorized, threaded discussions. This is non-negotiable; it's how the original built its moat. Categories like: General Discussion, Tour Life, Agency Talk, Gear & Tech, City-Specific Channels, Newbie Questions, etc.
- **Trend/data tracking** — modernized as a public-facing "State of Experiential" dashboard showing aggregated platform stats (avg pay rates by city/role, fastest-growing markets, most in-demand skills). Anonymous, aggregated only.

### 4.2 Modern upgrades (confirmed for V1)

| Feature | What it does | Notes |
|---|---|---|
| **Two-way ratings & reviews** | After each completed event, agency rates ambassador and vice versa. 1–5 stars + tagged feedback (e.g. "On time", "Great with crowds", "Followed brief"). Public on profiles after both submit or 7 days, whichever first. | Mutual-blind release prevents retaliation bias. |
| **AI-powered matching** | When an agency posts a job, surface a ranked shortlist of suggested ambassadors. When an ambassador opens the app, surface jobs ranked by fit. | Use embeddings on profile + job text; combine with hard filters (location radius, availability, required skills). Provider: OpenAI `text-embedding-3-small` or equivalent. |
| **Community forum** | See 4.1 — listed here too because the modern build should include reactions, mentions, image embeds, mod tools, reputation points. | Don't reinvent — consider Discourse embed if speed > control; else custom on Postgres. |
| **ID verification & background checks** | Agencies require it for certain gigs (alcohol promos, kids' events, high-value brands). Ambassadors complete once and reuse. | Use **Stripe Identity** for ID (fast, cheap). **Checkr** for background checks (optional, ambassador-paid or agency-paid). Display "Verified" badges. |
| **Calendar/availability sync** | Ambassadors set recurring availability + block specific dates. Confirmed gigs auto-populate calendar. Optional 2-way sync with Google Calendar / Apple Calendar via iCal feed + Google OAuth. | Source of truth: platform DB. |
| **Photo & video portfolios** | Ambassadors upload up to N photos and short videos per profile. Tag with brand, role, year. Agencies can browse a media-first grid view. | Storage: Supabase Storage or Cloudflare R2. Video: transcode via Mux or Cloudflare Stream. |
| **In-app messaging** | DM between agency ↔ ambassador, scoped to a specific application or open thread. Read receipts, attachments, push notifications. | Use Supabase Realtime channels or Sendbird. No off-platform contact info shared until booking confirmed. |

### 4.3 Monetization (confirmed)

**Agencies pay a subscription. Ambassadors are always free.**

Three tiers (final pricing `[CONFIGURE]`):

- **Starter** — `[CONFIGURE]`/mo. Up to 5 active job posts, 25 applications/mo, basic profile.
- **Growth** — `[CONFIGURE]`/mo. Unlimited posts, unlimited applications, AI matching shortlist, featured listings, team seats (3).
- **Enterprise** — `[CONFIGURE]`/mo or custom. Everything in Growth + API access, dedicated success manager, white-label options, unlimited team seats, advanced analytics.

Annual billing offered at ~17% discount.

Stripe Checkout + Customer Portal + webhooks. Plan limits enforced server-side via a `subscriptions` table joined to `agencies`.

---

## 5. Recommended Tech Stack

Pick this unless you have a strong reason to deviate. If you deviate, surface the tradeoff in the README before writing code.

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui components.
- **Backend:** Next.js server actions + route handlers; Postgres via Supabase.
- **Auth:** Supabase Auth (email + Google + Apple). Row-Level Security enforced on every table.
- **Database:** Supabase Postgres. Use migrations (Supabase CLI). No ORM lock-in — raw SQL or Drizzle.
- **Storage:** Supabase Storage for images/profile assets; Cloudflare Stream or Mux for ambassador videos.
- **Payments:** Stripe (Subscriptions, Customer Portal, Webhooks). Stripe Identity for ID verification.
- **Background checks:** Checkr (V1.5 if scope-cutting).
- **Email:** Resend with React Email templates.
- **Realtime/messaging:** Supabase Realtime (cheapest); Sendbird if scale demands it post-launch.
- **AI matching:** OpenAI embeddings (`text-embedding-3-small`) stored in `pgvector`; ranking is cosine similarity + filter rules.
- **Analytics:** PostHog (self-host or cloud).
- **Hosting:** Vercel (frontend) + Supabase (DB).
- **CI/CD:** GitHub Actions running typecheck + tests on PRs; Vercel auto-deploys.
- **Monitoring:** Sentry for errors, Vercel Analytics for web vitals.
- **Mobile:** Web-first responsive PWA for V1. Native iOS/Android via Expo/React Native is a V2 decision.

---

## 6. Database Schema (Starting Sketch)

Use this as a foundation, not gospel. Adjust as the implementation reveals better structures. Every table gets `id` (uuid), `created_at`, `updated_at`. Enforce RLS so users only see their own private data.

```
users                    -- shared auth identity
  id, email, role (ambassador | agency_member | admin), phone, avatar_url

agencies                 -- the company
  id, name, slug, logo_url, description, website, hq_city, hq_state,
  hq_country, stripe_customer_id, subscription_status, plan_tier,
  trial_ends_at, billing_email

agency_members           -- multi-seat agency teams
  id, agency_id, user_id, role (owner | admin | recruiter), invited_by

ambassadors              -- the talent profile
  id, user_id, display_name, headline, bio, city, state, country,
  travel_radius_miles, willing_to_travel, transport (none|public|car),
  height_cm, apparel_top, apparel_bottom, shoe_size, age_range_band,
  languages text[], skills text[], hourly_rate_min_cents,
  hourly_rate_max_cents, verified_id_at, background_check_status,
  embedding vector(1536)

ambassador_media         -- photos & videos
  id, ambassador_id, type (image|video), url, thumbnail_url,
  brand_tag, role_tag, year, sort_order

availability             -- recurring + specific overrides
  id, ambassador_id, kind (recurring|block|open),
  weekday smallint NULL, date date NULL, start_time, end_time, note

jobs                     -- gig postings
  id, agency_id, posted_by_user_id, title, description, role_type,
  city, state, country, lat, lng, venue_name, start_at, end_at,
  pay_rate_cents, pay_basis (hour|flat|day), dress_code,
  requirements text[], headcount_needed, headcount_filled,
  status (draft|open|closed|cancelled|completed),
  requires_verified_id, requires_background_check,
  embedding vector(1536), featured boolean

applications             -- ambassadors → jobs
  id, job_id, ambassador_id, status (applied|shortlisted|offered|
  confirmed|declined|withdrawn|completed|no_show), cover_note,
  agency_note, offered_pay_cents

bookings                 -- the confirmed engagement
  id, application_id, check_in_at, check_out_at, lat_in, lng_in,
  hours_worked, payout_cents, payout_status (pending|paid|disputed)

reviews                  -- mutual, blind-released
  id, booking_id, reviewer_type (agency|ambassador),
  reviewer_id, subject_id, rating smallint, comment,
  tags text[], submitted_at, released_at

conversations            -- DM threads
  id, scope (application|open), application_id NULL,
  agency_id, ambassador_id, last_message_at

messages
  id, conversation_id, sender_user_id, body, attachment_url, read_at

forum_categories
  id, slug, name, description, sort_order, is_locked

forum_threads
  id, category_id, author_user_id, title, slug, body,
  pinned, locked, last_reply_at, view_count

forum_posts              -- replies in a thread
  id, thread_id, author_user_id, body, parent_post_id NULL

forum_reactions
  id, post_id, user_id, kind (like|love|insightful|fire)

verifications
  id, user_id, kind (id|background), provider, provider_ref,
  status (pending|approved|rejected), completed_at

subscriptions
  id, agency_id, stripe_subscription_id, plan_tier,
  status, current_period_end, cancel_at_period_end

notifications
  id, user_id, kind, payload jsonb, read_at

audit_log                -- admin moderation actions
  id, actor_user_id, action, target_type, target_id, meta jsonb
```

---

## 7. Page & Route Inventory

### Public
- `/` — Marketing home (split CTAs: "Hire Ambassadors" / "Find Work")
- `/jobs` — Public job board (read-only preview; full apply requires login)
- `/jobs/[slug]` — Job detail
- `/ambassadors` — Public ambassador directory (limited; full access for paying agencies)
- `/ambassadors/[slug]` — Public ambassador profile
- `/forum` — Forum index
- `/forum/[category]` — Threads in category
- `/forum/[category]/[thread]` — Thread + replies
- `/insights` — Public "State of Experiential" dashboard
- `/pricing`, `/about`, `/contact`, `/legal/*`
- `/login`, `/signup` (with role selector: agency vs ambassador)

### Agency dashboard `/a/*`
- `/a` — Overview (active jobs, recent applications, messages)
- `/a/jobs` — Manage jobs (list + create/edit)
- `/a/jobs/[id]/applicants` — Review applicants (with AI shortlist toggle)
- `/a/ambassadors` — Search/browse the talent pool
- `/a/messages` — Inbox
- `/a/team` — Team seats
- `/a/billing` — Stripe Customer Portal entry
- `/a/settings` — Agency profile

### Ambassador dashboard `/m/*`
- `/m` — Overview (matched jobs, messages, upcoming bookings)
- `/m/jobs` — Browse + AI-recommended feed
- `/m/applications` — Track applications
- `/m/calendar` — Availability + bookings
- `/m/messages` — Inbox
- `/m/portfolio` — Manage photos/videos
- `/m/verification` — ID & background check status
- `/m/profile` — Edit profile
- `/m/settings`

### Admin `/admin/*`
- `/admin` — Platform stats
- `/admin/users` — User mgmt
- `/admin/verifications` — Manual review queue
- `/admin/forum` — Moderation
- `/admin/disputes` — Dispute resolution

---

## 8. Key User Flows

### 8.1 Agency onboarding
1. Sign up → choose "Agency" → email verification.
2. Create agency profile (name, logo, locations served).
3. Hit paywall: choose plan → Stripe Checkout → webhook activates subscription.
4. 14-day free trial on Starter and Growth; Enterprise is sales-assisted.
5. Land on `/a` with empty state guiding first job post.

### 8.2 Ambassador onboarding
1. Sign up → choose "Ambassador" → email + phone verification.
2. Profile wizard: photos → basics → skills/languages → availability → optional ID verification.
3. AI immediately suggests 5 matching jobs on completion.

### 8.3 Job post + matching
1. Agency creates job → on save, generate embedding from `title + description + requirements`.
2. Run cosine similarity against ambassador embeddings within location radius and matching hard filters.
3. Return top 20 in agency's "AI Suggested" tab.
4. Ambassadors with matching profile see the job ranked at top of their feed.

### 8.4 Application → booking → review
1. Ambassador applies (optional cover note).
2. Agency shortlists → offers (with confirmed pay rate).
3. Ambassador confirms → booking created.
4. Day of event: ambassador checks in via app (GPS optional in V1; manual fine).
5. Post-event: agency marks completed → both prompted to leave review.
6. Reviews released to public on mutual submit or 7-day timeout.

### 8.5 Forum participation
1. Any logged-in user can read.
2. Posting requires profile completion (anti-spam).
3. Reactions, @mentions, embedded images, markdown.
4. Mods can pin/lock/move/delete; admin sees full audit log.

---

## 9. Phased Build Plan

### Phase 1 — MVP (target: shippable in 6–8 weeks of focused build)
Auth, agency + ambassador profiles, job posting, applications, basic messaging, Stripe subscriptions for agencies, forum (basic), public marketing pages, ID verification via Stripe Identity. **No** AI matching yet (use simple filters), **no** video portfolio (photos only), **no** GPS check-in, **no** native apps.

### Phase 2 — Differentiation (4–6 weeks after MVP)
AI matching (embeddings + ranking), two-way reviews, video portfolios, calendar sync (iCal feed + Google OAuth), forum reactions and moderation tools, public "State of Experiential" dashboard.

### Phase 3 — Scale & polish
Native iOS/Android via Expo, GPS check-in/out, background checks via Checkr, advanced agency analytics, API access for Enterprise, multi-region (Canada/UK next).

---

## 10. Non-Functional Requirements

- **Security:** RLS on every Supabase table. No PII in client-side logs. Encrypt sensitive fields at rest where required. CSRF protection on all mutations.
- **Privacy:** Comply with CCPA, GDPR-ready. Ambassadors can delete account → soft-delete with 30-day recovery, then hard-purge media. Clear data-export endpoint.
- **Performance:** Lighthouse score ≥ 90 on key public pages. Job feed and ambassador search must paginate server-side. AI matching pre-computed nightly + on-demand for new posts.
- **Accessibility:** WCAG 2.1 AA. Keyboard nav, alt text required on uploads, contrast checks in CI.
- **SEO:** Server-rendered public pages with proper meta + JSON-LD `JobPosting` schema on every public job. Sitemap auto-generated.
- **Mobile:** Responsive first; the ambassador dashboard especially must be excellent on mobile — that's where they live.

---

## 11. Design & Brand Direction

- Aesthetic: confident, kinetic, modern. Think Linear meets Cameo meets a trade-show floor. NOT a sleepy corporate jobs board.
- Photography-forward: ambassador profiles and job cards should feel like content, not forms.
- Use a vibrant accent color (`[CONFIGURE]` — placeholder: electric coral `#FF4B3E`) against a neutral charcoal/cream base.
- Typography: a personable display sans (e.g. Inter Tight or Geist) + a workhorse text face. No corporate Times-New-Roman energy.
- Microcopy with personality, never cringe. Use industry vernacular ("activation," "brief," "gig," "wrap") — show you actually know this world.

---

## 12. Things to Confirm With Me Before Building

Surface these as a short checklist in your first response. Do not assume:

1. **Final brand name** — placeholder is "EventSpeak."
2. **Pricing tier amounts.**
3. **Legal entity / tax form handling** — will the platform issue 1099s to ambassadors who earn over $600/yr via the platform? (If we hold payments, yes — significant complexity. If we don't hold payments, no.)
4. **Do we hold and route payments**, or just connect parties and let the agency pay the ambassador directly? (V1 recommendation: don't hold payments — defer to V2. Confirm.)
5. **Domain name** for deployment.
6. **Email sender domain** for transactional mail (Resend setup).
7. **Are background checks an MVP requirement or V2?** (Recommend V2.)

---

## 13. Acceptance Criteria (MVP Done = This)

- [ ] An agency can sign up, pay for a subscription via Stripe, post a job, and review applicants.
- [ ] An ambassador can sign up free, build a profile with photos, set availability, browse jobs, and apply.
- [ ] Both parties can message each other inside the platform after an application exists.
- [ ] An ambassador can complete Stripe Identity verification and display the verified badge.
- [ ] The forum is functional: categories, threads, replies, basic moderation.
- [ ] Public marketing pages render server-side, score ≥ 90 on Lighthouse, and rank for `JobPosting` schema.
- [ ] All tables have RLS; no user can read another user's private data via API.
- [ ] Stripe webhook reliably activates/cancels subscriptions and updates `agencies.subscription_status`.
- [ ] Email notifications fire for: new application, new message, status change, subscription events.
- [ ] CI runs typecheck + at least smoke tests on every PR.

---

## 14. How to Work With Me

- Confirm the open questions in §12 before writing code that depends on them.
- Propose a folder structure, run it past me, then scaffold.
- Build in vertical slices: pick one flow end-to-end (e.g. agency signup → job post) and ship it fully before moving on.
- Commit early and often with descriptive messages.
- Keep a running `DECISIONS.md` documenting every meaningful tradeoff so future-me (and future-you) can audit it.
- When in doubt about UX, choose the option that respects the ambassador's time. They are the network effect; agencies follow the talent.

Now: read this end-to-end, ask me about §12, and propose your scaffold.