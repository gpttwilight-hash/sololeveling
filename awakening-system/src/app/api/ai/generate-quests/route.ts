import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPremium } from "@/lib/game/subscriptions";
import { sanitizeAIQuest, AI_QUEST_LIMITS } from "@/lib/game/ai-quest-sanitizer";
import type { Profile, QuestType, QuestDifficulty, AttributeKey } from "@/types/game";

const VALID_TYPES = new Set<QuestType>(["daily", "weekly", "epic"]);
const VALID_DIFFICULTIES = new Set<QuestDifficulty>(["easy", "medium", "hard", "legendary"]);
const VALID_ATTRIBUTES = new Set<AttributeKey>(["str", "int", "cha", "dis", "wlt", "hidden"]);

function toQuestType(val: string): QuestType {
  return VALID_TYPES.has(val as QuestType) ? (val as QuestType) : "daily";
}
function toQuestDifficulty(val: string): QuestDifficulty {
  return VALID_DIFFICULTIES.has(val as QuestDifficulty) ? (val as QuestDifficulty) : "medium";
}
function toAttributeKey(val: string): AttributeKey {
  return VALID_ATTRIBUTES.has(val as AttributeKey) ? (val as AttributeKey) : "dis";
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as unknown as Profile;

  if (!isPremium(profile)) {
    return NextResponse.json({ error: "Pro subscription required" }, { status: 403 });
  }

  const body = await req.json() as { goal: string; deadline?: string; weeks?: number };
  const { data, error } = await supabase.functions.invoke("generate-quests", {
    body: { goal: body.goal, deadline: body.deadline, weeks: body.weeks ?? 4 },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const responseData = data as { quests: Array<{
    title: string;
    description?: string;
    type: string;
    difficulty: string;
    attribute: string;
    xp_reward: number;
    coin_reward: number;
    week: number;
  }> };

  // Bulk insert generated quests — coerce AI strings to strict union types
  const now = new Date().toISOString();
  const quests = responseData.quests.slice(0, AI_QUEST_LIMITS.MAX_COUNT).map((q) => {
    const sanitized = sanitizeAIQuest(q);
    return {
      user_id: user.id,
      title: q.title,
      description: q.description ?? null,
      type: toQuestType(q.type),
      difficulty: toQuestDifficulty(q.difficulty),
      attribute: toAttributeKey(q.attribute),
      xp_reward: sanitized.xp_reward,
      coin_reward: sanitized.coin_reward,
      is_active: true,
      is_completed: false,
      is_recurring: q.type === "daily",
      streak: 0,
      sort_order: (q.week ?? 0) * 10,
      created_at: now,
      updated_at: now,
    };
  });

  const { data: inserted, error: insertError } = await supabase
    .from("quests")
    .insert(quests)
    .select();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ quests: inserted, count: inserted?.length ?? 0 });
}
