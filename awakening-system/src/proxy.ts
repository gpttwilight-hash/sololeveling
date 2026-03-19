import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do not remove this line
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Auth routes: redirect to dashboard if already logged in
  if (user && (pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/forgot-password"))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Protected app routes: redirect to login if not authenticated
  const protectedPaths = ["/dashboard", "/quests", "/stats", "/achievements", "/shop", "/settings"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Onboarding: redirect new users who haven't completed onboarding.
  // Use a session cookie set after onboarding to avoid a DB query on every request.
  if (user && isProtected) {
    const onboardingDone = request.cookies.get("onboarding_completed")?.value === "1";
    if (!onboardingDone) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (profile && !profile.onboarding_completed) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }

      // Set cookie so we skip the DB check on subsequent requests
      if (profile?.onboarding_completed) {
        supabaseResponse.cookies.set("onboarding_completed", "1", {
          httpOnly: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: "/",
        });
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
