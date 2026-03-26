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

  // Fetch quest metadata before RPC (needed for attr column, parent_id, logging)
  const { data: rawQuest, error: questErr } = await supabase
    .from("quests")
    .select("*")
    .eq("id", questId)
    .eq("user_id", user.id)
    .single();

  if (questErr || !rawQuest) throw new Error("Quest not found");
  const quest = rawQuest as unknown as Quest;
  // Optimistic early-exit only — NOT an authoritative guard.
  // The RPC's FOR UPDATE lock is the only atomic safeguard against double-completion.
  if (quest.is_completed) throw new Error("Quest already completed");

  // Fetch profile snapshot for debuff calculation (used for level/rank delta post-RPC)
  const { data: rawProfile, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (profileErr || !rawProfile) throw new Error("Profile not found");
  const profile = rawProfile as unknown as Profile;

  // Apply debuff penalty (computed in JS, passed to RPC as pre-computed values)
  const debuffs = (profile.active_debuffs as Array<{ type: "laziness" | "burnout"; xp_penalty?: number; triggered_at: string }>) ?? [];
  const laziness = debuffs.find((d) => d.type === "laziness");
  const rawPenalty = laziness ? Math.min(100, Math.max(0, laziness.xp_penalty ?? 25)) : 0;
  const xpPenaltyMultiplier = 1 - rawPenalty / 100;
  const partialMultiplier = partial ? 0.5 : 1;
  const xpEarned = Math.round(quest.xp_reward * xpPenaltyMultiplier * partialMultiplier);
  const coinsEarned = Math.round(quest.coin_reward * partialMultiplier);

  // Validate attribute column
  const VALID_ATTR_COLUMNS = ["str_xp", "int_xp", "cha_xp", "dis_xp", "wlt_xp", "hidden_xp"] as const;
  type AttrColumn = typeof VALID_ATTR_COLUMNS[number];
  const candidateCol = `${quest.attribute}_xp`;
  if (!(VALID_ATTR_COLUMNS as readonly string[]).includes(candidateCol)) {
    throw new Error(`Invalid attribute: ${quest.attribute}`);
  }
  const attrColumn = candidateCol as AttrColumn;

  // ATOMIC: Complete quest + update all profile stats in one DB transaction
  const { error: rpcError } = await supabase.rpc("complete_quest", {
    p_quest_id: questId,
    p_user_id: user.id,
    p_xp_earned: xpEarned,
    p_coins_earned: coinsEarned,
    p_attr_column: attrColumn,
  });
  if (rpcError) throw new Error(`Failed to complete quest: ${rpcError.message}`);

  // --- Non-atomic post-completion work ---

  // Compute level/rank changes using pre-RPC profile snapshot
  const { leveledUp, newLevel } = checkLevelUp(profile.total_xp, xpEarned);
  const rankedUp = leveledUp ? checkRankUp(profile.level, newLevel) : false;
  const newRank = rankedUp ? getRankFromLevel(newLevel).id : undefined;

  // Update level/rank on profile if leveled up
  if (leveledUp || rankedUp) {
    const { error: levelUpdateError } = await supabase
      .from("profiles")
      .update({
        level: newLevel,
        ...(newRank ? { rank: newRank } : {}),
      })
      .eq("id", user.id);
    if (levelUpdateError) throw new Error("Failed to update level/rank");
  }

  // NCT System: If linked to an Epic, increment Epic's progress & synergy
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
          synergy_points: (parentEpic.synergy_points ?? 0) + 10,
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

  await supabase.from("daily_progress").upsert({
    user_id: user.id,
    date: today,
    quests_completed: completedCount,
    quests_total: totalCount,
    xp_earned: (dp?.xp_earned ?? 0) + xpEarned,
    completion_rate: completedCount / totalCount,
    is_rest_day: dp?.is_rest_day ?? false,
  });

  // Check achievements against updated profile state
  const newTotalXP = profile.total_xp + xpEarned;
  const newCoins = profile.coins + coinsEarned;
  const updatedProfile: Profile = {
    ...profile,
    total_xp: newTotalXP,
    coins: newCoins,
    total_quests_completed: profile.total_quests_completed + 1,
    level: newLevel,
    rank: newRank ?? profile.rank,
    [attrColumn]: (profile[attrColumn] as number) + xpEarned,
    total_coins_earned: (profile.total_coins_earned ?? 0) + coinsEarned,
    active_debuffs: debuffs,
  };

  const { data: allAchievements } = await supabase.from("achievements").select("*");
  const { data: userAchievements } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", user.id);

  const unlockedIds = new Set(userAchievements?.map((a) => a.achievement_id) ?? []);
  const newlyUnlocked: string[] = [];
  const toUnlock: { user_id: string; achievement_id: string }[] = [];

  for (const achievement of allAchievements ?? []) {
    if (unlockedIds.has(achievement.id)) continue;
    const met = evaluateCondition(achievement.condition as AchievementCondition, {
      profile: updatedProfile,
      totalCoinsEarned: updatedProfile.total_coins_earned ?? 0,
    });
    if (met) {
      toUnlock.push({ user_id: user.id, achievement_id: achievement.id });
      newlyUnlocked.push(achievement.id);
    }
  }
  if (toUnlock.length > 0) {
    await supabase.from("user_achievements").insert(toUnlock);
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

  // Enforce cooldown: check if enough time has elapsed since last redemption
  if (reward.cooldown_hours && reward.last_redeemed_at) {
    const lastRedeemed = new Date(reward.last_redeemed_at as string).getTime();
    const cooldownMs = (reward.cooldown_hours as number) * 60 * 60 * 1000;
    const cooldownEndsAt = lastRedeemed + cooldownMs;
    if (Date.now() < cooldownEndsAt) {
      const remainingHours = Math.ceil((cooldownEndsAt - Date.now()) / (60 * 60 * 1000));
      throw new Error(`Награда недоступна ещё ${remainingHours} ч.`);
    }
  }

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
    source: "shop",
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
  const { data: profileForRest } = await supabase
    .from("profiles")
    .select("rest_days_used_this_week")
    .eq("id", user.id)
    .single();

  await supabase
    .from("profiles")
    .update({ rest_days_used_this_week: ((profileForRest?.rest_days_used_this_week as number) ?? 0) + 1 })
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
  type: "daily" | "weekly" | "epic" | "tutorial";
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
  frequency_per_week?: number;
  reward_emoji?: string;
  reward_title?: string;
}): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Input validation
  const title = data.title?.trim();
  if (!title || title.length === 0) throw new Error("Название квеста не может быть пустым");
  if (title.length > 120) throw new Error("Название квеста слишком длинное (макс. 120 символов)");

  const VALID_TYPES = ["daily", "weekly", "epic", "tutorial"] as const;
  const VALID_ATTRS = ["str", "int", "cha", "dis", "wlt", "hidden"] as const;
  const VALID_DIFFS = ["easy", "medium", "hard", "legendary"] as const;
  if (!(VALID_TYPES as readonly string[]).includes(data.type)) throw new Error("Неверный тип квеста");
  if (!(VALID_ATTRS as readonly string[]).includes(data.attribute)) throw new Error("Неверный атрибут");
  if (!(VALID_DIFFS as readonly string[]).includes(data.difficulty)) throw new Error("Неверная сложность");

  if (data.target_value !== undefined && (data.target_value < 1 || data.target_value > 99999)) {
    throw new Error("Целевое значение должно быть от 1 до 99999");
  }
  if (data.frequency_per_week !== undefined && (data.frequency_per_week < 1 || data.frequency_per_week > 7)) {
    throw new Error("Частота должна быть от 1 до 7 раз в неделю");
  }
  if (data.reward_title && data.reward_title.length > 100) {
    throw new Error("Название награды слишком длинное (макс. 100 символов)");
  }

  const xpByDifficulty: Record<string, number> = {
    easy: 8, medium: 15, hard: 30, legendary: 80,
  };
  const xp = xpByDifficulty[data.difficulty] ?? 15;
  const coins = Math.ceil(xp * 0.5);

  const { error: insertError } = await supabase.from("quests").insert({
    user_id: user.id,
    title,
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
    frequency_per_week: data.frequency_per_week ?? 7,
    reward_emoji: data.reward_emoji || null,
    reward_title: data.reward_title || null,
  });

  if (insertError) throw new Error(`Не удалось создать квест: ${insertError.message}`);

  revalidatePath("/quests");
}

export async function updateQuest(questId: string, data: {
  title: string;
  type: "daily" | "weekly" | "epic" | "tutorial";
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
  frequency_per_week?: number;
  reward_emoji?: string;
  reward_title?: string;
}): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Input validation — mirrors createQuest validation
  const title = data.title?.trim();
  if (!title || title.length === 0) throw new Error("Название квеста не может быть пустым");
  if (title.length > 120) throw new Error("Название квеста слишком длинное (макс. 120 символов)");

  const xpByDifficulty: Record<string, number> = {
    easy: 8, medium: 15, hard: 30, legendary: 80,
  };
  const xp = xpByDifficulty[data.difficulty] ?? 15;
  const coins = Math.ceil(xp * 0.5);

  const { error: updateError } = await supabase
    .from("quests")
    .update({
      title,
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
      frequency_per_week: data.frequency_per_week ?? 7,
      reward_emoji: data.reward_emoji || null,
      reward_title: data.reward_title || null,
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
      const VALID_ATTR_COLS = ["str_xp", "int_xp", "cha_xp", "dis_xp", "wlt_xp", "hidden_xp"] as const;
      const candidateAttrCol = `${quest.attribute}_xp`;
      if (!(VALID_ATTR_COLS as readonly string[]).includes(candidateAttrCol)) {
        throw new Error(`Invalid attribute: ${quest.attribute}`);
      }
      const attrColumn = candidateAttrCol as typeof VALID_ATTR_COLS[number];
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

  const hunterName = data.hunter_name?.trim();
  if (!hunterName || hunterName.length === 0) throw new Error("Имя охотника не может быть пустым");
  if (hunterName.length > 30) throw new Error("Имя охотника слишком длинное (макс. 30 символов)");

  await supabase
    .from("profiles")
    .update({ hunter_name: hunterName, avatar_id: data.avatar_id })
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
  const updates = questIds.slice(0, 500).map((id, index) =>
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
  const VALID_DISPATCH_ATTRS = ["str_xp", "int_xp", "cha_xp", "dis_xp", "wlt_xp"] as const;
  const candidateDispatchCol = `${dispatch.attribute_focus}_xp`;
  if (!(VALID_DISPATCH_ATTRS as readonly string[]).includes(candidateDispatchCol)) {
    throw new Error(`Invalid dispatch attribute: ${dispatch.attribute_focus}`);
  }
  const attrColumn = candidateDispatchCol as typeof VALID_DISPATCH_ATTRS[number];

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

  // Get XP from TypeScript constants — portal_templates DB table is not populated
  const { PORTAL_TEMPLATES } = await import("@/lib/game/portal-templates");
  const template = PORTAL_TEMPLATES.find((t) => t.id === (progress.template_id as string));
  if (!template) throw new Error("Portal template not found");

  const xpEarned = template.steps[stepIndex].xp;
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
