import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Validate Web Push subscription shape
  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).endpoint !== "string" ||
    !(body as Record<string, unknown>).endpoint ||
    typeof (body as Record<string, unknown>).keys !== "object"
  ) {
    return NextResponse.json(
      { error: "Invalid push subscription: must include endpoint and keys" },
      { status: 400 }
    );
  }

  const subscription = body as Json;

  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: user.id,
    subscription,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
