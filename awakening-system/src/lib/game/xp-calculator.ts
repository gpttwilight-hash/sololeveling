import { XP_CONFIG } from "./constants";
import type { XPProgress } from "@/types/game";

/**
 * XP required to advance FROM level N to level N+1.
 * Formula: baseXP * (level ^ scalingFactor)
 *
 * Examples:
 *   level 1 → 2:  100 XP
 *   level 2 → 3:  160 XP
 *   level 5 → 6:  371 XP
 *   level 9 → 10: ~1000 XP
 */
export function getRequiredXP(level: number): number {
  if (level <= 0) return XP_CONFIG.baseXP;
  if (level >= XP_CONFIG.maxLevel) return Infinity;
  return Math.round(XP_CONFIG.baseXP * Math.pow(level, XP_CONFIG.scalingFactor));
}

/**
 * Total XP needed to reach a level from zero.
 */
export function getTotalXPForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let l = 1; l < level; l++) {
    total += getRequiredXP(l);
  }
  return total;
}

/**
 * Derive current level and XP progress from total accumulated XP.
 */
export function getXPProgress(totalXP: number): XPProgress {
  let level = 1;
  let accumulated = 0;

  while (level < XP_CONFIG.maxLevel) {
    const required = getRequiredXP(level);
    if (accumulated + required > totalXP) break;
    accumulated += required;
    level++;
  }

  const currentXP = totalXP - accumulated;
  const requiredXP = getRequiredXP(level);
  const percentage = requiredXP === Infinity ? 100 : Math.min(100, (currentXP / requiredXP) * 100);

  return { level, currentXP, requiredXP, percentage };
}

/**
 * Returns the level derived from total XP.
 */
export function getLevelFromTotalXP(totalXP: number): number {
  return getXPProgress(totalXP).level;
}
