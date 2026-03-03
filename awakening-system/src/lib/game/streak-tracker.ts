/**
 * Streak logic.
 * - If yesterday had progress (completion_rate > 0) OR was a rest day → streak continues
 * - Otherwise → streak resets to 0
 */
export function calculateNewStreak(
  currentStreak: number,
  yesterdayHadProgress: boolean,
  yesterdayWasRestDay: boolean
): number {
  if (yesterdayHadProgress || yesterdayWasRestDay) {
    return currentStreak + 1;
  }
  return 0;
}

/**
 * Determine if a debuff should be applied.
 * Laziness: 3+ consecutive missed days.
 */
export function shouldApplyLaziness(consecutiveMissedDays: number): boolean {
  return consecutiveMissedDays >= 3;
}
