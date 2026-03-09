import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let subscription: Json;
  try {
    subscription = (await req.json()) as Json;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

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
