import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { site } from "@/config/site";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? site.routes.talent.root;

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`${site.routes.login}?error=${encodeURIComponent(error.message)}`, request.url),
      );
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
