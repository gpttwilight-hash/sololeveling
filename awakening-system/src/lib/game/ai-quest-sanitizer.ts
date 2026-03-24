export const AI_QUEST_LIMITS = {
  MAX_COUNT: 50,
  MAX_XP_REWARD: 80,   // legendary difficulty cap
  MAX_COIN_REWARD: 40,
  MIN_REWARD: 1,
} as const;

export function sanitizeAIQuest(q: { xp_reward: number; coin_reward: number }) {
  return {
    xp_reward: Math.min(
      AI_QUEST_LIMITS.MAX_XP_REWARD,
      Math.max(AI_QUEST_LIMITS.MIN_REWARD, Math.round(q.xp_reward))
    ),
    coin_reward: Math.min(
      AI_QUEST_LIMITS.MAX_COIN_REWARD,
      Math.max(AI_QUEST_LIMITS.MIN_REWARD, Math.round(q.coin_reward))
    ),
  };
}
