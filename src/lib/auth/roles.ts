import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { site } from "@/config/site";

export type Role = "ambassador" | "agency_member" | "admin";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect(site.routes.login);
  return user;
}

export async function requireRole(role: Role | Role[]) {
  const user = await requireUser();
  const allowed = Array.isArray(role) ? role : [role];
  const userRole = (user.user_metadata?.role ?? user.app_metadata?.role) as Role | undefined;
  if (!userRole || !allowed.includes(userRole)) {
    redirect(site.routes.home);
  }
  return { user, role: userRole };
}
