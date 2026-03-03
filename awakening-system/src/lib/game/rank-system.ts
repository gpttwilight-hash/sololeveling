import { RANKS } from "./constants";
import type { Rank } from "@/types/game";

/**
 * Get rank definition for a given level.
 */
export function getRankFromLevel(level: number): Rank {
  return (
    RANKS.find(
      (r) => level >= r.levelRange[0] && level <= r.levelRange[1]
    ) ?? RANKS[RANKS.length - 1]
  );
}

/**
 * Check if a level transition causes a rank change.
 */
export function checkRankUp(oldLevel: number, newLevel: number): boolean {
  if (oldLevel === newLevel) return false;
  const oldRank = getRankFromLevel(oldLevel);
  const newRank = getRankFromLevel(newLevel);
  return oldRank.id !== newRank.id;
}

/**
 * Get rank color CSS variable string for inline styles.
 */
export function getRankColor(rankId: string): string {
  const rank = RANKS.find((r) => r.id === rankId);
  return rank?.color ?? "#6B7280";
}
