import type { AchievementCondition, Profile } from "@/types/game";

interface CheckContext {
  profile: Profile;
  newQuestsCompleted?: number;
  newStreak?: number;
  newLevel?: number;
  newRank?: string;
  epicsCompleted?: number;
  rewardsRedeemed?: number;
  totalCoinsEarned?: number;
}

/**
 * Evaluate a single achievement condition against current context.
 */
export function evaluateCondition(
  condition: AchievementCondition,
  ctx: CheckContext
): boolean {
  const { profile } = ctx;

  switch (condition.type) {
    case "quests_completed":
      return profile.total_quests_completed >= condition.count;

    case "streak_days":
      return profile.current_streak >= condition.count;

    case "level_reached":
      return profile.level >= condition.level;

    case "rank_reached": {
      const rankOrder = ["E", "D", "C", "B", "A", "S"];
      return rankOrder.indexOf(profile.rank) >= rankOrder.indexOf(condition.rank);
    }

    case "attribute_points": {
      const xpMap: Record<string, number> = {
        str: profile.str_xp,
        int: profile.int_xp,
        cha: profile.cha_xp,
        dis: profile.dis_xp,
        wlt: profile.wlt_xp,
        hidden: profile.hidden_xp,
      };
      const points = Math.floor((xpMap[condition.attribute] ?? 0) / 10);
      return points >= condition.min;
    }

    case "coins_earned":
      // Use totalCoinsEarned if provided; fall back to profile.coins for backwards compatibility
      return (ctx.totalCoinsEarned ?? profile.coins) >= condition.total;

    case "epic_completed":
      return (ctx.epicsCompleted ?? 0) >= 1;

    case "rewards_redeemed":
      return (ctx.rewardsRedeemed ?? 0) >= condition.count;

    default:
      return false;
  }
}
