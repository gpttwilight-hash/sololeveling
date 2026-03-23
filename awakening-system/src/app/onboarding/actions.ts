"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { STARTER_QUESTS, type FocusKey } from "./data";

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const hunterName = (formData.get("hunter_name") as string)?.trim();
  if (!hunterName || hunterName.length === 0) throw new Error("Имя охотника не может быть пустым");
  if (hunterName.length > 30) throw new Error("Имя охотника слишком длинное (макс. 30 символов)");

  const rawAvatarId = (formData.get("avatar_id") as string) || "default";
  const VALID_AVATAR_IDS = ["default", "warrior", "mage", "rogue", "paladin", "archer"];
  const avatarId = VALID_AVATAR_IDS.includes(rawAvatarId) ? rawAvatarId : "default";

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

  // Seed tutorial quests — teach the app mechanics by doing
  const tutorialQuests = [
    { title: "Выполни свой первый ежедневный квест", xp_reward: 20, coin_reward: 10, attribute: "dis" },
    { title: "Создай собственный квест",              xp_reward: 15, coin_reward: 8,  attribute: "int" },
    { title: "Загляни в Магазин и изучи награды",    xp_reward: 10, coin_reward: 5,  attribute: "wlt" },
    { title: "Потрать монеты на любую награду",       xp_reward: 15, coin_reward: 10, attribute: "wlt" },
    { title: "Создай Epic Quest",                     xp_reward: 20, coin_reward: 10, attribute: "dis" },
    { title: "Открой раздел Статистика",              xp_reward: 10, coin_reward: 5,  attribute: "int" },
    { title: "Открой раздел Достижения",              xp_reward: 10, coin_reward: 5,  attribute: "int" },
    { title: "Выполни 3 квеста за один день",         xp_reward: 25, coin_reward: 15, attribute: "dis" },
    { title: "Поддержи streak 2 дня подряд",          xp_reward: 30, coin_reward: 20, attribute: "dis" },
  ].map((q, i) => ({
    user_id: user.id,
    title: q.title,
    type: "tutorial" as const,
    attribute: q.attribute as "str" | "int" | "cha" | "dis" | "wlt" | "hidden",
    difficulty: "easy" as const,
    xp_reward: q.xp_reward,
    coin_reward: q.coin_reward,
    is_active: true,
    is_completed: false,
    is_recurring: false,
    sort_order: i,
  }));

  const { error: tutorialError } = await supabase.from("quests").insert(tutorialQuests);
  if (tutorialError) console.error("[onboarding] tutorial quests insert error:", tutorialError);

  // Insert default rewards
  const { error: rewardsError } = await supabase.rpc("insert_default_rewards", { p_user_id: user.id });
  if (rewardsError) console.error("[onboarding] rewards rpc error:", rewardsError);

  const cookieStore = await cookies();
  cookieStore.set("onboarding_completed", "1", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

