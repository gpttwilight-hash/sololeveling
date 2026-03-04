"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkLevelUp } from "@/lib/game/level-system";
import { checkRankUp, getRankFromLevel } from "@/lib/game/rank-system";
import { evaluateCondition } from "@/lib/game/achievement-checker";
import type { CompleteQuestResult, AchievementCondition, Profile } from "@/types/game";

export async function completeQuest(questId: string): Promise<CompleteQuestResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch quest
  const { data: quest, error: questErr } = await supabase
    .from("quests")
    .select("*")
    .eq("id", questId)
    .eq("user_id", user.id)
    .single();

  if (questErr || !quest) throw new Error(`Quest not found (id=${questId}, err=${questErr?.message})`);
  if (quest.is_completed) throw new Error("Quest already completed");

  // Fetch current profile
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile) throw new Error(`Profile not found (err=${profileErr?.message})`);
  console.log(`[completeQuest] quest="${quest.title}" type=${quest.type} xp_reward=${quest.xp_reward}`);

  // Apply debuff penalty if active
  const debuffs = (profile.active_debuffs as Array<{ type: "laziness" | "burnout"; xp_penalty?: number; triggered_at: string }>) ?? [];
  const laziness = debuffs.find((d) => d.type === "laziness");
  const xpPenaltyMultiplier = laziness ? 1 - (laziness.xp_penalty ?? 25) / 100 : 1;
  const xpEarned = Math.round(quest.xp_reward * xpPenaltyMultiplier);
  const coinsEarned = quest.coin_reward;

  // Determine attribute XP column
  const attrColumn = `${quest.attribute}_xp` as
    | "str_xp" | "int_xp" | "cha_xp" | "dis_xp" | "wlt_xp" | "hidden_xp";

  // Check level/rank changes
  const { leveledUp, newLevel } = checkLevelUp(profile.total_xp, xpEarned);
  const rankedUp = checkLevelUp(profile.total_xp, xpEarned).leveledUp
    ? checkRankUp(profile.level, newLevel)
    : false;
  const newRank = rankedUp ? getRankFromLevel(newLevel).id : undefined;

  const newTotalXP = profile.total_xp + xpEarned;
  const newCoins = profile.coins + coinsEarned;
  const newQuestsCompleted = profile.total_quests_completed + 1;

  // Update profile
  await supabase
    .from("profiles")
    .update({
      total_xp: newTotalXP,
      coins: newCoins,
      total_quests_completed: newQuestsCompleted,
      level: newLevel,
      ...(newRank ? { rank: newRank } : {}),
      [attrColumn]: (profile[attrColumn] as number) + xpEarned,
    })
    .eq("id", user.id);

  // Mark quest as completed
  await supabase
    .from("quests")
    .update({ is_completed: true, streak: (quest.streak ?? 0) + 1 })
    .eq("id", questId);

  // Log completion
  await supabase.from("quest_logs").insert({
    user_id: user.id,
    quest_id: questId,
    quest_title: quest.title,
    quest_type: quest.type,
    attribute: quest.attribute,
    xp_earned: xpEarned,
    coins_earned: coinsEarned,
  });

  // Upsert daily progress
  const today = new Date().toISOString().split("T")[0];
  const { data: dp } = await supabase
    .from("daily_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  const completedCount = (dp?.quests_completed ?? 0) + 1;
  const totalCount = dp?.quests_total ?? 1;

  await supabase
    .from("daily_progress")
    .upsert({
      user_id: user.id,
      date: today,
      quests_completed: completedCount,
      quests_total: totalCount,
      xp_earned: (dp?.xp_earned ?? 0) + xpEarned,
      completion_rate: completedCount / totalCount,
      is_rest_day: dp?.is_rest_day ?? false,
    });

  // Check achievements
  const updatedProfile: Profile = {
    ...profile,
    total_xp: newTotalXP,
    coins: newCoins,
    total_quests_completed: newQuestsCompleted,
    level: newLevel,
    rank: newRank ?? profile.rank,
    [attrColumn]: (profile[attrColumn] as number) + xpEarned,
    active_debuffs: debuffs,
  };

  const { data: allAchievements } = await supabase.from("achievements").select("*");
  const { data: userAchievements } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", user.id);

  const unlockedIds = new Set(userAchievements?.map((a) => a.achievement_id) ?? []);
  const newlyUnlocked: string[] = [];

  for (const achievement of allAchievements ?? []) {
    if (unlockedIds.has(achievement.id)) continue;
    const met = evaluateCondition(achievement.condition as AchievementCondition, {
      profile: updatedProfile,
    });
    if (met) {
      await supabase.from("user_achievements").insert({
        user_id: user.id,
        achievement_id: achievement.id,
      });
      newlyUnlocked.push(achievement.id);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/quests");
  revalidatePath("/stats");

  return {
    xpEarned,
    coinsEarned,
    leveledUp,
    newLevel: leveledUp ? newLevel : undefined,
    rankedUp,
    newRank,
    achievementsUnlocked: newlyUnlocked,
  };
}

export async function redeemReward(rewardId: string): Promise<{ success: boolean; remainingCoins: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: reward } = await supabase
    .from("rewards")
    .select("*")
    .eq("id", rewardId)
    .eq("user_id", user.id)
    .single();

  if (!reward) throw new Error("Reward not found");

  const { data: profile } = await supabase
    .from("profiles")
    .select("coins")
    .eq("id", user.id)
    .single();

  if (!profile || profile.coins < reward.cost) {
    return { success: false, remainingCoins: profile?.coins ?? 0 };
  }

  const remaining = profile.coins - reward.cost;

  await supabase.from("profiles").update({ coins: remaining }).eq("id", user.id);
  await supabase.from("reward_logs").insert({
    user_id: user.id,
    reward_id: rewardId,
    reward_title: reward.title,
    cost: reward.cost,
  });
  await supabase
    .from("rewards")
    .update({ last_redeemed_at: new Date().toISOString() })
    .eq("id", rewardId);

  revalidatePath("/shop");
  revalidatePath("/dashboard");

  return { success: true, remainingCoins: remaining };
}

export async function declareRestDay(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const today = new Date().toISOString().split("T")[0];
  await supabase.from("daily_progress").upsert({
    user_id: user.id,
    date: today,
    is_rest_day: true,
  });
  await supabase
    .from("profiles")
    .update({ rest_days_used_this_week: 1 })
    .eq("id", user.id);

  revalidatePath("/dashboard");
}

export async function updateEpicProgress(questId: string, value: number): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("quests")
    .update({ current_value: value })
    .eq("id", questId)
    .eq("user_id", user.id);

  revalidatePath("/quests");
}

export async function createQuest(data: {
  title: string;
  type: "daily" | "weekly" | "epic";
  attribute: "str" | "int" | "cha" | "dis" | "wlt" | "hidden";
  difficulty: "easy" | "medium" | "hard" | "legendary";
  description?: string;
  target_value?: number;
  deadline?: string;
}): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const xpByDifficulty: Record<string, number> = {
    easy: 8, medium: 15, hard: 30, legendary: 80,
  };
  const xp = xpByDifficulty[data.difficulty] ?? 15;
  const coins = Math.ceil(xp * 0.5);

  await supabase.from("quests").insert({
    user_id: user.id,
    title: data.title,
    type: data.type,
    attribute: data.attribute,
    difficulty: data.difficulty,
    xp_reward: xp,
    coin_reward: coins,
    description: data.description,
    target_value: data.target_value,
    deadline: data.deadline,
  });

  revalidatePath("/quests");
}

export async function deleteQuest(questId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("quests")
    .update({ is_active: false })
    .eq("id", questId)
    .eq("user_id", user.id);

  revalidatePath("/quests");
  revalidatePath("/settings");
}
