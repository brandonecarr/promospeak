-- Seed data for local development. Runs after migrations on `supabase db reset`.
-- Forum categories per §4.1 of the brief.

INSERT INTO "public"."forum_categories" (slug, name, description, sort_order)
VALUES
  ('general', 'General Discussion', 'The town square. Anything goes.', 10),
  ('tour-life', 'Tour Life', 'On the road, mobile activations, the mileage stories.', 20),
  ('agency-talk', 'Agency Talk', 'For agency owners and recruiters: ops, hiring, the business side.', 30),
  ('gear-and-tech', 'Gear & Tech', 'Apps, kit, uniforms, samplers, the tools of the trade.', 40),
  ('cities', 'City-Specific Channels', 'Local scenes — venues, lead-times, market trends.', 50),
  ('newbie', 'Newbie Questions', 'Just getting started? Ask here, no judgement.', 60)
ON CONFLICT (slug) DO NOTHING;
