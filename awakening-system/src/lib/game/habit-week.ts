/**
 * Pure functions for habit week cycle logic.
 * No Supabase calls — used by actions and page server components.
 */

/**
 * Returns the Monday (ISO date string) of the week containing `date`.
 * Week = Monday 00:00 – Sunday 23:59.
 */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split("T")[0];
}

/**
 * Determines if a recurring daily quest should be reset today.
 *
 * For frequency_per_week = 7: always reset (same as current behavior).
 * For frequency_per_week < 7: only reset if weekly target not yet met.
 */
export function shouldResetQuest(
  lastResetDate: string | null,
  today: string,
  frequencyPerWeek: number,
  weeklyCompletions: number
): boolean {
  // Not completed since last reset — nothing to reset
  if (lastResetDate === today) return false;
  // If no last reset date, always reset
  if (!lastResetDate || lastResetDate < today) {
    // For daily (7/7): always reset
    if (frequencyPerWeek >= 7) return true;
    // For habit (< 7): only reset if target not yet met
    return weeklyCompletions < frequencyPerWeek;
  }
  return false;
}

/**
 * Computes the new streak value when a new week starts.
 *
 * For frequency_per_week < 7: streak = consecutive successful weeks.
 * For frequency_per_week = 7: streak is unchanged here (managed by complete_quest RPC).
 */
export function computeWeeklyStreak(
  currentStreak: number,
  frequencyPerWeek: number,
  previousWeekSuccess: boolean | null
): number {
  // For daily quests (7/7), streak is managed per-completion, not per-week
  if (frequencyPerWeek >= 7) return currentStreak;

  // For habit quests (< 7), streak counts successful weeks
  if (previousWeekSuccess === true) return currentStreak + 1;
  if (previousWeekSuccess === false) return 0;
  // null = no previous week record (first week) — start at 0
  return 0;
}
