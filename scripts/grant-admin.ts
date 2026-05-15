/**
 * Grant a user the admin role.
 *
 * Looks the user up by email, updates their `users.role` to 'admin', and stamps
 * `app_metadata.role = 'admin'` on the auth user so requireRole() picks it up
 * from JWT claims without a DB roundtrip.
 *
 * Usage:
 *   pnpm grant-admin you@example.com   (loads .env.local automatically)
 *
 * For prod, pull env from Vercel first:
 *   vercel env pull .env.production.local
 *   dotenv -e .env.production.local -- tsx scripts/grant-admin.ts you@example.com
 *
 * NEVER expose the service role key to the browser.
 */
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
if (!email) {
  console.error("Usage: pnpm tsx scripts/grant-admin.ts <email>");
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) {
    console.error(listError.message);
    process.exit(1);
  }
  const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.error(`No auth user found for ${email}`);
    process.exit(1);
  }

  const { error: metaError } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: { ...(user.app_metadata ?? {}), role: "admin" },
  });
  if (metaError) {
    console.error(metaError.message);
    process.exit(1);
  }

  const { error: rowError } = await supabase
    .from("users")
    .update({ role: "admin" })
    .eq("id", user.id);
  if (rowError) {
    console.error(rowError.message);
    process.exit(1);
  }

  console.log(`Granted admin to ${email} (${user.id}).`);
}

main();
