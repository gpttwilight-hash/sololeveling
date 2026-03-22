import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", origin));
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", origin));
  }

  // If caller specified a next page (e.g. /reset-password), go there.
  // For password recovery: append ?recovery=1 so the client page can show the
  // form immediately without waiting for PASSWORD_RECOVERY event (which never
  // fires in PKCE flow because the code exchange happened server-side).
  if (next) {
    const nextUrl = new URL(next, origin);
    if (next.includes("reset-password")) {
      nextUrl.searchParams.set("recovery", "1");
    }
    return NextResponse.redirect(nextUrl);
  }

  // Determine where to send the user based on onboarding status
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) {
    // Set the onboarding cookie so middleware skips the DB check
    cookieStore.set("onboarding_completed", "1", {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  return NextResponse.redirect(new URL("/onboarding", origin));
}
