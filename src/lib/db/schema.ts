import {
  boolean,
  date,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["ambassador", "agency_member", "admin"]);
export const agencyMemberRole = pgEnum("agency_member_role", ["owner", "admin", "recruiter"]);
export const subscriptionStatus = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "paused",
]);
export const planTier = pgEnum("plan_tier", ["starter", "growth", "enterprise"]);
export const jobStatus = pgEnum("job_status", [
  "draft",
  "open",
  "closed",
  "cancelled",
  "completed",
]);
export const payBasis = pgEnum("pay_basis", ["hour", "flat", "day"]);
export const applicationStatus = pgEnum("application_status", [
  "applied",
  "shortlisted",
  "offered",
  "confirmed",
  "declined",
  "withdrawn",
  "completed",
  "no_show",
]);
export const verificationKind = pgEnum("verification_kind", ["id", "background"]);
export const verificationStatus = pgEnum("verification_status", [
  "pending",
  "approved",
  "rejected",
]);
export const transportMode = pgEnum("transport_mode", ["none", "public", "car"]);

const id = () => uuid("id").primaryKey().defaultRandom();
const created = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updated = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  role: userRole("role").notNull(),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  createdAt: created(),
  updatedAt: updated(),
});

export const agencies = pgTable("agencies", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  description: text("description"),
  website: text("website"),
  hqCity: text("hq_city"),
  hqState: text("hq_state"),
  hqCountry: text("hq_country").notNull().default("US"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  billingEmail: text("billing_email"),
  createdAt: created(),
  updatedAt: updated(),
});

export const agencyMembers = pgTable(
  "agency_members",
  {
    id: id(),
    agencyId: uuid("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: agencyMemberRole("role").notNull().default("recruiter"),
    invitedByUserId: uuid("invited_by_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: created(),
  },
  (t) => ({
    uniqueMember: uniqueIndex("agency_members_agency_user_idx").on(t.agencyId, t.userId),
  }),
);

export const ambassadors = pgTable("ambassadors", {
  id: id(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  slug: text("slug").notNull().unique(),
  headline: text("headline"),
  bio: text("bio"),
  city: text("city"),
  state: text("state"),
  country: text("country").notNull().default("US"),
  travelRadiusMiles: integer("travel_radius_miles"),
  willingToTravel: boolean("willing_to_travel").notNull().default(false),
  transport: transportMode("transport").notNull().default("none"),
  heightCm: integer("height_cm"),
  apparelTop: text("apparel_top"),
  apparelBottom: text("apparel_bottom"),
  shoeSize: text("shoe_size"),
  ageRangeBand: text("age_range_band"),
  languages: text("languages").array().notNull().default([]),
  skills: text("skills").array().notNull().default([]),
  hourlyRateMinCents: integer("hourly_rate_min_cents"),
  hourlyRateMaxCents: integer("hourly_rate_max_cents"),
  verifiedIdAt: timestamp("verified_id_at", { withTimezone: true }),
  backgroundCheckStatus: verificationStatus("background_check_status"),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: created(),
  updatedAt: updated(),
});

export const jobs = pgTable("jobs", {
  id: id(),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  postedByUserId: uuid("posted_by_user_id").notNull().references(() => users.id, {
    onDelete: "restrict",
  }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  roleType: text("role_type").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull().default("US"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  venueName: text("venue_name"),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  payRateCents: integer("pay_rate_cents").notNull(),
  payBasis: payBasis("pay_basis").notNull(),
  dressCode: text("dress_code"),
  requirements: text("requirements").array().notNull().default([]),
  headcountNeeded: integer("headcount_needed").notNull().default(1),
  headcountFilled: integer("headcount_filled").notNull().default(0),
  status: jobStatus("status").notNull().default("draft"),
  requiresVerifiedId: boolean("requires_verified_id").notNull().default(false),
  requiresBackgroundCheck: boolean("requires_background_check").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: created(),
  updatedAt: updated(),
});

export const applications = pgTable(
  "applications",
  {
    id: id(),
    jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
    ambassadorId: uuid("ambassador_id").notNull().references(() => ambassadors.id, {
      onDelete: "cascade",
    }),
    status: applicationStatus("status").notNull().default("applied"),
    coverNote: text("cover_note"),
    agencyNote: text("agency_note"),
    offeredPayCents: integer("offered_pay_cents"),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => ({
    uniqueApplication: uniqueIndex("applications_job_ambassador_idx").on(t.jobId, t.ambassadorId),
  }),
);

export const subscriptions = pgTable("subscriptions", {
  id: id(),
  agencyId: uuid("agency_id").notNull().unique().references(() => agencies.id, {
    onDelete: "cascade",
  }),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  planTier: planTier("plan_tier").notNull(),
  status: subscriptionStatus("status").notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  createdAt: created(),
  updatedAt: updated(),
});

// Tables for later vertical slices — schema stubs only. Flesh out as slices land:
// ambassador_media, bookings, reviews, forum_reactions, notifications, audit_log.

export const conversations = pgTable("conversations", {
  id: id(),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  ambassadorId: uuid("ambassador_id").notNull().references(() => ambassadors.id, {
    onDelete: "cascade",
  }),
  applicationId: uuid("application_id").references(() => applications.id, {
    onDelete: "set null",
  }),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  createdAt: created(),
});

export const messages = pgTable("messages", {
  id: id(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, {
    onDelete: "cascade",
  }),
  senderUserId: uuid("sender_user_id").notNull().references(() => users.id, {
    onDelete: "cascade",
  }),
  body: text("body").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: created(),
});

export const verifications = pgTable("verifications", {
  id: id(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: verificationKind("kind").notNull(),
  provider: text("provider").notNull(),
  providerRef: text("provider_ref"),
  status: verificationStatus("status").notNull().default("pending"),
  paidByAgencyId: uuid("paid_by_agency_id").references(() => agencies.id, { onDelete: "set null" }),
  paidByJobId: uuid("paid_by_job_id").references(() => jobs.id, { onDelete: "set null" }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  payload: jsonb("payload"),
  createdAt: created(),
  updatedAt: updated(),
});

// Forum tables — MVP-scope per §4.1, custom on Postgres per project decision.
export const forumCategories = pgTable("forum_categories", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: smallint("sort_order").notNull().default(0),
  isLocked: boolean("is_locked").notNull().default(false),
  createdAt: created(),
});

export const forumThreads = pgTable("forum_threads", {
  id: id(),
  categoryId: uuid("category_id").notNull().references(() => forumCategories.id, {
    onDelete: "cascade",
  }),
  authorUserId: uuid("author_user_id").notNull().references(() => users.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  body: text("body").notNull(),
  pinned: boolean("pinned").notNull().default(false),
  locked: boolean("locked").notNull().default(false),
  lastReplyAt: timestamp("last_reply_at", { withTimezone: true }),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: created(),
  updatedAt: updated(),
});

export const forumPosts = pgTable("forum_posts", {
  id: id(),
  threadId: uuid("thread_id").notNull().references(() => forumThreads.id, { onDelete: "cascade" }),
  authorUserId: uuid("author_user_id").references(() => users.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  parentPostId: uuid("parent_post_id"),
  createdAt: created(),
  updatedAt: updated(),
});

// Re-export availability as a stub structure so it shows up in Drizzle but isn't yet wired:
export const availability = pgTable("availability", {
  id: id(),
  ambassadorId: uuid("ambassador_id").notNull().references(() => ambassadors.id, {
    onDelete: "cascade",
  }),
  kind: text("kind").notNull(),
  weekday: smallint("weekday"),
  date: date("date"),
  startTime: time("start_time"),
  endTime: time("end_time"),
  note: text("note"),
  createdAt: created(),
});
