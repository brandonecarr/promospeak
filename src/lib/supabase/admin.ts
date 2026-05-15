import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/config/env";
import type { Database } from "@/types/database";

export function createSupabaseAdminClient() {
  const env = serverEnv();
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
