import { getLevelFromTotalXP } from "./xp-calculator";

export interface LevelUpResult {
  leveledUp: boolean;
  newLevel: number;
}

/**
 * Check if adding xpGained to oldTotalXP causes a level up.
 */
export function checkLevelUp(oldTotalXP: number, xpGained: number): LevelUpResult {
  const oldLevel = getLevelFromTotalXP(oldTotalXP);
  const newLevel = getLevelFromTotalXP(oldTotalXP + xpGained);
  return {
    leveledUp: newLevel > oldLevel,
    newLevel,
  };
}
