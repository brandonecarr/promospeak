-- Enable Row-Level Security on every application table. Per §10 of the
-- product brief, RLS is required on every table. Policies are added
-- per vertical slice as features land; until a policy is added, no client
-- (anon or authenticated) can read or write the table — only the service-role
-- client bypasses RLS.

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."agencies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."agency_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ambassadors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."availability" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."verifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."forum_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."forum_threads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."forum_posts" ENABLE ROW LEVEL SECURITY;
