"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STARTER_QUESTS, type FocusKey } from "./data";

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const hunterName = formData.get("hunter_name") as string;
  const avatarId = formData.get("avatar_id") as string;
  const focusKeys = formData.getAll("focus") as FocusKey[];
  const selectedQuestIds = formData.getAll("quests") as string[];

  // Build quest list from selections
  const allQuests: Array<{
    title: string;
    attribute: string;
    difficulty: string;
    xp_reward: number;
    coin_reward: number;
  }> = [];

  for (const focus of focusKeys) {
    const quests = STARTER_QUESTS[focus];
    if (quests) {
      for (const q of quests) {
        allQuests.push({ ...q, attribute: focus });
      }
    }
  }

  // Filter to selected quests (by index-based IDs like "str_0", "int_1")
  const selectedQuests = selectedQuestIds
    .map((qid) => {
      const [attr, idx] = qid.split("_");
      const list = STARTER_QUESTS[attr as FocusKey];
      return list ? { ...list[Number(idx)], attribute: attr } : null;
    })
    .filter(Boolean);

  // Update profile
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      hunter_name: hunterName,
      avatar_id: avatarId || "default",
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("[onboarding] profile update error:", profileError);
    throw new Error(`Ошибка сохранения профиля: ${profileError.message}`);
  }

  // Insert selected quests
  if (selectedQuests.length > 0) {
    type QuestInsert = {
      user_id: string;
      title: string;
      type: "daily";
      attribute: "str" | "int" | "cha" | "dis" | "wlt" | "hidden";
      difficulty: "easy" | "medium" | "hard" | "legendary";
      xp_reward: number;
      coin_reward: number;
      sort_order: number;
    };
    const inserts: QuestInsert[] = selectedQuests
      .filter((q): q is NonNullable<typeof q> => q !== null)
      .map((q, i) => ({
        user_id: user.id,
        title: q.title,
        type: "daily" as const,
        attribute: q.attribute as "str" | "int" | "cha" | "dis" | "wlt" | "hidden",
        difficulty: q.difficulty as "easy" | "medium" | "hard" | "legendary",
        xp_reward: q.xp_reward,
        coin_reward: q.coin_reward,
        sort_order: i,
      }));
    const { error: questsError } = await supabase.from("quests").insert(inserts);
    if (questsError) console.error("[onboarding] quests insert error:", questsError);
  }

  // Insert default rewards
  const { error: rewardsError } = await supabase.rpc("insert_default_rewards", { p_user_id: user.id });
  if (rewardsError) console.error("[onboarding] rewards rpc error:", rewardsError);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

