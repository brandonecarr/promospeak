"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { site } from "@/config/site";

const signupSchema = z
  .object({
    email: z.email("Enter a valid email."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    role: z.enum(["agency_member", "ambassador"]),
    displayName: z.string().min(1, "Tell us what to call you.").max(120),
    organizationName: z.string().max(200).optional(),
  })
  .refine(
    (data) => data.role !== "agency_member" || (data.organizationName?.trim()?.length ?? 0) > 0,
    { message: "Agency name is required.", path: ["organizationName"] },
  );

const signinSchema = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

export type AuthFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> }
  | { status: "success"; message: string };

async function getOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host");
  return host ? `${proto}://${host}` : site.url;
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    displayName: formData.get("displayName"),
    organizationName: formData.get("organizationName") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = await createSupabaseServerClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        role: parsed.data.role,
        display_name: parsed.data.displayName,
        organization_name: parsed.data.organizationName ?? null,
      },
    },
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  if (!data.session) {
    return {
      status: "success",
      message: "Check your email to confirm your account before logging in.",
    };
  }

  redirect(landingFor(parsed.data.role));
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signinSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { status: "error", message: error.message };
  }

  const role = (data.user?.user_metadata?.role ?? data.user?.app_metadata?.role) as
    | "agency_member"
    | "ambassador"
    | "admin"
    | undefined;
  redirect(landingFor(role));
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(site.routes.home);
}

function landingFor(role: string | undefined) {
  switch (role) {
    case "agency_member":
      return site.routes.agency.root;
    case "admin":
      return site.routes.admin.root;
    case "ambassador":
    default:
      return site.routes.talent.root;
  }
}
