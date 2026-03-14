"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkLevelUp } from "@/lib/game/level-system";
import { checkRankUp, getRankFromLevel } from "@/lib/game/rank-system";
import { getLevelFromTotalXP } from "@/lib/game/xp-calculator";
import { evaluateCondition } from "@/lib/game/achievement-checker";
import type { CompleteQuestResult, AchievementCondition, Profile, Quest } from "@/types/game";
import { isPremium } from "@/lib/game/subscriptions";

export async function completeQuest(questId: string, partial = false): Promise<CompleteQuestResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch quest
  const { data: rawQuest, error: questErr } = await supabase
    .from("quests")
    .select("*")
    .eq("id", questId)
    .eq("user_id", user.id)
    .single();

  const quest = rawQuest as unknown as Quest;

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
  const partialMultiplier = partial ? 0.5 : 1;
  const xpEarned = Math.round(quest.xp_reward * xpPenaltyMultiplier * partialMultiplier);
  const coinsEarned = Math.round(quest.coin_reward * partialMultiplier);

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

  // NCT System: If this quest is linked to an Epic, increment Epic's progress & synergy
  if (quest.parent_id) {
    const { data: rawEpic } = await supabase
      .from("quests")
      .select("*")
      .eq("id", quest.parent_id)
      .single();

    if (rawEpic) {
      const parentEpic = rawEpic as unknown as Quest;
      await supabase
        .from("quests")
        .update({
          current_value: (parentEpic.current_value ?? 0) + 1,
          synergy_points: (parentEpic.synergy_points ?? 0) + 10 // e.g. 10 pts per habit completed
        })
        .eq("id", quest.parent_id);
    }
  }

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
  is_recurring?: boolean;
  trigger_time?: string;
  trigger_location?: string;
  trigger_anchor?: string;
  min_description?: string;
  parent_id?: string;
  narrative?: string;
}): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Subscription Check: Epic quests are for Monarchs only
  if (data.type === "epic") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single() as { data: Profile | null };

    // if (!isPremium(profile)) {
    //   throw new Error("Эпические квесты доступны только Охотникам ранга Монарх.");
    // }
  }

  const xpByDifficulty: Record<string, number> = {
    easy: 8, medium: 15, hard: 30, legendary: 80,
  };
  const xp = xpByDifficulty[data.difficulty] ?? 15;
  const coins = Math.ceil(xp * 0.5);

  const { error: insertError } = await supabase.from("quests").insert({
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
    is_recurring: data.is_recurring ?? false,
    trigger_time: data.trigger_time || null,
    trigger_location: data.trigger_location || null,
    trigger_anchor: data.trigger_anchor || null,
    min_description: data.min_description || null,
    parent_id: data.parent_id || null,
    narrative: data.narrative || null,
  });

  if (insertError) throw new Error(`Не удалось создать квест: ${insertError.message}`);

  revalidatePath("/quests");
}

export async function updateQuest(questId: string, data: {
  title: string;
  type: "daily" | "weekly" | "epic";
  attribute: "str" | "int" | "cha" | "dis" | "wlt" | "hidden";
  difficulty: "easy" | "medium" | "hard" | "legendary";
  description?: string;
  target_value?: number;
  deadline?: string;
  is_recurring?: boolean;
  trigger_time?: string;
  trigger_location?: string;
  trigger_anchor?: string;
  min_description?: string;
  parent_id?: string;
  narrative?: string;
}): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const xpByDifficulty: Record<string, number> = {
    easy: 8, medium: 15, hard: 30, legendary: 80,
  };
  const xp = xpByDifficulty[data.difficulty] ?? 15;
  const coins = Math.ceil(xp * 0.5);

  const { error: updateError } = await supabase
    .from("quests")
    .update({
      title: data.title,
      type: data.type,
      attribute: data.attribute,
      difficulty: data.difficulty,
      xp_reward: xp,
      coin_reward: coins,
      description: data.description,
      target_value: data.target_value,
      deadline: data.deadline,
      is_recurring: data.is_recurring ?? false,
      trigger_time: data.trigger_time || null,
      trigger_location: data.trigger_location || null,
      trigger_anchor: data.trigger_anchor || null,
      min_description: data.min_description || null,
      parent_id: data.parent_id || null,
      narrative: data.narrative || null,
    })
    .eq("id", questId)
    .eq("user_id", user.id);

  if (updateError) throw new Error(`Не удалось обновить квест: ${updateError.message}`);

  revalidatePath("/quests");
  revalidatePath("/dashboard");
}

export async function deleteQuest(questId: string): Promise<{ xpRemoved: number; coinsRemoved: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch quest attribute
  const { data: quest } = await supabase
    .from("quests")
    .select("attribute")
    .eq("id", questId)
    .eq("user_id", user.id)
    .single();

  if (!quest) throw new Error("Quest not found");

  // Sum all XP/coins earned from this quest
  const { data: logs } = await supabase
    .from("quest_logs")
    .select("xp_earned, coins_earned")
    .eq("quest_id", questId)
    .eq("user_id", user.id);

  const xpRemoved = logs?.reduce((s, l) => s + (l.xp_earned ?? 0), 0) ?? 0;
  const coinsRemoved = logs?.reduce((s, l) => s + (l.coins_earned ?? 0), 0) ?? 0;
  const completionsRemoved = logs?.length ?? 0;

  // Subtract from profile
  if (xpRemoved > 0 || coinsRemoved > 0) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_xp, coins, total_quests_completed, str_xp, int_xp, cha_xp, dis_xp, wlt_xp, hidden_xp")
      .eq("id", user.id)
      .single();

    if (profile) {
      const attrColumn = `${quest.attribute}_xp` as
        | "str_xp" | "int_xp" | "cha_xp" | "dis_xp" | "wlt_xp" | "hidden_xp";
      const newTotalXP = Math.max(0, profile.total_xp - xpRemoved);
      const newLevel = getLevelFromTotalXP(newTotalXP);
      const newRank = getRankFromLevel(newLevel).id;

      await supabase
        .from("profiles")
        .update({
          total_xp: newTotalXP,
          level: newLevel,
          rank: newRank,
          coins: Math.max(0, profile.coins - coinsRemoved),
          total_quests_completed: Math.max(0, profile.total_quests_completed - completionsRemoved),
          [attrColumn]: Math.max(0, (profile[attrColumn] as number) - xpRemoved),
        })
        .eq("id", user.id);
    }
  }

  // Soft-delete quest
  await supabase
    .from("quests")
    .update({ is_active: false })
    .eq("id", questId)
    .eq("user_id", user.id);

  revalidatePath("/quests");
  revalidatePath("/dashboard");
  revalidatePath("/stats");

  return { xpRemoved, coinsRemoved };
}

export async function updateProfile(data: { hunter_name: string; avatar_id: string }): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("profiles")
    .update({ hunter_name: data.hunter_name, avatar_id: data.avatar_id })
    .eq("id", user.id);

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
}

export async function createReward(data: {
  title: string;
  emoji: string;
  cost: number;
  cooldown_hours?: number;
}): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get max sort_order
  const { data: existing } = await supabase
    .from("rewards")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = ((existing?.[0]?.sort_order as number) ?? 0) + 1;

  await supabase.from("rewards").insert({
    user_id: user.id,
    title: data.title,
    description: null,
    emoji: data.emoji,
    cost: data.cost,
    cooldown_hours: data.cooldown_hours ?? null,
    last_redeemed_at: null,
    sort_order: nextOrder,
    is_active: true,
  });

  revalidatePath("/shop");
}

export async function reorderQuests(questIds: string[]): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Perform updates in parallel
  const updates = questIds.map((id, index) =>
    supabase
      .from("quests")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("user_id", user.id)
  );

  await Promise.all(updates);
  revalidatePath("/quests");
  revalidatePath("/dashboard");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export async function completeDispatch(date: string): Promise<{ xpEarned: number; coinsEarned: number }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: dispatch } = await db
    .from("daily_dispatch")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .single() as { data: AnyRecord | null };

  if (!dispatch) throw new Error("Dispatch not found");
  if (dispatch.is_completed) throw new Error("Dispatch already completed");
  if (new Date() > new Date(dispatch.expires_at as string)) throw new Error("Dispatch expired");

  const xpEarned = dispatch.bonus_quest_xp as number;
  const coinsEarned = dispatch.bonus_quest_coins as number;
  const attrColumn = `${dispatch.attribute_focus}_xp` as
    | "str_xp" | "int_xp" | "cha_xp" | "dis_xp" | "wlt_xp";

  const { data: profile } = await supabase
    .from("profiles")
    .select("total_xp, coins, total_quests_completed, str_xp, int_xp, cha_xp, dis_xp, wlt_xp")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  await supabase.from("profiles").update({
    total_xp: (profile.total_xp as number) + xpEarned,
    coins: (profile.coins as number) + coinsEarned,
    total_quests_completed: (profile.total_quests_completed as number) + 1,
    [attrColumn]: (((profile as AnyRecord)[attrColumn] as number) ?? 0) + xpEarned,
  }).eq("id", user.id);

  await db
    .from("daily_dispatch")
    .update({ is_completed: true })
    .eq("user_id", user.id)
    .eq("date", date);

  await supabase.from("quest_logs").insert({
    user_id: user.id,
    quest_id: null,
    quest_title: dispatch.bonus_quest_title as string,
    quest_type: "daily",
    attribute: dispatch.attribute_focus as string,
    xp_earned: xpEarned,
    coins_earned: coinsEarned,
  });

  revalidatePath("/dashboard");
  return { xpEarned, coinsEarned };
}

export async function startPortal(date: string, templateId: string): Promise<void> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await db.from("user_portal_progress").upsert({
    user_id: user.id,
    date,
    template_id: templateId,
    steps_completed: 0,
    is_finished: false,
    started_at: new Date().toISOString(),
  });

  revalidatePath("/dashboard");
}

export async function completePortalStep(
  date: string,
  stepIndex: number
): Promise<{ isFinished: boolean; xpEarned: number }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: progress } = await db
    .from("user_portal_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .single() as { data: AnyRecord | null };

  if (!progress) throw new Error("Portal progress not found");
  if ((progress.steps_completed as number) !== stepIndex) {
    throw new Error(`Step ${stepIndex} not yet unlocked`);
  }

  const { data: template } = await db
    .from("portal_templates")
    .select("*")
    .eq("id", progress.template_id)
    .single() as { data: AnyRecord | null };

  if (!template) throw new Error("Portal template not found");

  const stepXpField = `step${stepIndex + 1}_xp` as "step1_xp" | "step2_xp" | "step3_xp";
  const xpEarned = template[stepXpField] as number;
  const newStepsCompleted = stepIndex + 1;
  const isFinished = newStepsCompleted === 3;

  await db.from("user_portal_progress").update({
    steps_completed: newStepsCompleted,
    is_finished: isFinished,
    finished_at: isFinished ? new Date().toISOString() : null,
  }).eq("user_id", user.id).eq("date", date);

  const { data: profile } = await supabase
    .from("profiles")
    .select("total_xp, coins")
    .eq("id", user.id)
    .single();

  if (profile) {
    const coins = Math.ceil(xpEarned * 0.5);
    await supabase.from("profiles").update({
      total_xp: (profile.total_xp as number) + xpEarned,
      coins: (profile.coins as number) + coins,
    }).eq("id", user.id);
  }

  revalidatePath("/dashboard");
  return { isFinished, xpEarned };
}
