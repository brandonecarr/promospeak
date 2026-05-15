import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { clientEnv } from "@/config/env";
import type { Database } from "@/types/database";

export async function createSupabaseServerClient() {
  const env = clientEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll may fail in server components that can't mutate cookies;
            // middleware handles session refresh, so this is safe to swallow.
          }
        },
      },
    },
  );
}
