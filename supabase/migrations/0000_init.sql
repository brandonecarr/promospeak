-- Required extensions. Manually prepended to Drizzle-generated migration.
-- Drizzle's `generate` only writes new migrations for schema diffs and will
-- not overwrite this file, so the prepend is safe.
CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."agency_member_role" AS ENUM('owner', 'admin', 'recruiter');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('applied', 'shortlisted', 'offered', 'confirmed', 'declined', 'withdrawn', 'completed', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('draft', 'open', 'closed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."pay_basis" AS ENUM('hour', 'flat', 'day');--> statement-breakpoint
CREATE TYPE "public"."plan_tier" AS ENUM('starter', 'growth', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'paused');--> statement-breakpoint
CREATE TYPE "public"."transport_mode" AS ENUM('none', 'public', 'car');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ambassador', 'agency_member', 'admin');--> statement-breakpoint
CREATE TYPE "public"."verification_kind" AS ENUM('id', 'background');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "agencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"description" text,
	"website" text,
	"hq_city" text,
	"hq_state" text,
	"hq_country" text DEFAULT 'US' NOT NULL,
	"stripe_customer_id" text,
	"billing_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agencies_slug_unique" UNIQUE("slug"),
	CONSTRAINT "agencies_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "agency_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "agency_member_role" DEFAULT 'recruiter' NOT NULL,
	"invited_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ambassadors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"slug" text NOT NULL,
	"headline" text,
	"bio" text,
	"city" text,
	"state" text,
	"country" text DEFAULT 'US' NOT NULL,
	"travel_radius_miles" integer,
	"willing_to_travel" boolean DEFAULT false NOT NULL,
	"transport" "transport_mode" DEFAULT 'none' NOT NULL,
	"height_cm" integer,
	"apparel_top" text,
	"apparel_bottom" text,
	"shoe_size" text,
	"age_range_band" text,
	"languages" text[] DEFAULT '{}' NOT NULL,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"hourly_rate_min_cents" integer,
	"hourly_rate_max_cents" integer,
	"verified_id_at" timestamp with time zone,
	"background_check_status" "verification_status",
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ambassadors_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "ambassadors_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"ambassador_id" uuid NOT NULL,
	"status" "application_status" DEFAULT 'applied' NOT NULL,
	"cover_note" text,
	"agency_note" text,
	"offered_pay_cents" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ambassador_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"weekday" smallint,
	"date" date,
	"start_time" time,
	"end_time" time,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "forum_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "forum_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"author_user_id" uuid,
	"body" text NOT NULL,
	"parent_post_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"author_user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"body" text NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"last_reply_at" timestamp with time zone,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "forum_threads_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"posted_by_user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"role_type" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"country" text DEFAULT 'US' NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"venue_name" text,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"pay_rate_cents" integer NOT NULL,
	"pay_basis" "pay_basis" NOT NULL,
	"dress_code" text,
	"requirements" text[] DEFAULT '{}' NOT NULL,
	"headcount_needed" integer DEFAULT 1 NOT NULL,
	"headcount_filled" integer DEFAULT 0 NOT NULL,
	"status" "job_status" DEFAULT 'draft' NOT NULL,
	"requires_verified_id" boolean DEFAULT false NOT NULL,
	"requires_background_check" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"plan_tier" "plan_tier" NOT NULL,
	"status" "subscription_status" NOT NULL,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_agency_id_unique" UNIQUE("agency_id"),
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" NOT NULL,
	"phone" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "verification_kind" NOT NULL,
	"provider" text NOT NULL,
	"provider_ref" text,
	"status" "verification_status" DEFAULT 'pending' NOT NULL,
	"paid_by_agency_id" uuid,
	"paid_by_job_id" uuid,
	"completed_at" timestamp with time zone,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agency_members" ADD CONSTRAINT "agency_members_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_members" ADD CONSTRAINT "agency_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_members" ADD CONSTRAINT "agency_members_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ambassadors" ADD CONSTRAINT "ambassadors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_ambassador_id_ambassadors_id_fk" FOREIGN KEY ("ambassador_id") REFERENCES "public"."ambassadors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_ambassador_id_ambassadors_id_fk" FOREIGN KEY ("ambassador_id") REFERENCES "public"."ambassadors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_thread_id_forum_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."forum_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_category_id_forum_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."forum_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_posted_by_user_id_users_id_fk" FOREIGN KEY ("posted_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_paid_by_agency_id_agencies_id_fk" FOREIGN KEY ("paid_by_agency_id") REFERENCES "public"."agencies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_paid_by_job_id_jobs_id_fk" FOREIGN KEY ("paid_by_job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agency_members_agency_user_idx" ON "agency_members" USING btree ("agency_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_job_ambassador_idx" ON "applications" USING btree ("job_id","ambassador_id");