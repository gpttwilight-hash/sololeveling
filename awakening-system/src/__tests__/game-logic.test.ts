import { describe, it, expect } from "vitest";
import { checkLevelUp } from "@/lib/game/level-system";
import { checkRankUp } from "@/lib/game/rank-system";
import { getTotalXPForLevel } from "@/lib/game/xp-calculator";
import { evaluateCondition } from "@/lib/game/achievement-checker";
import type { Profile } from "@/types/game";

// ─── HIGH-1: checkLevelUp + checkRankUp integration ───────────────────────────

describe("checkLevelUp + checkRankUp integration", () => {
  it("detects rank-up when leveling through a rank boundary (E→D at level 6)", () => {
    // E rank: levels 1-5, D rank: levels 6-15
    const xpAtLevel5 = getTotalXPForLevel(5);
    const xpNeededToReachLevel6 = getTotalXPForLevel(6) - xpAtLevel5 + 1;

    const { leveledUp, newLevel } = checkLevelUp(xpAtLevel5, xpNeededToReachLevel6);
    expect(leveledUp).toBe(true);
    expect(newLevel).toBeGreaterThanOrEqual(6);

    // Using first result only (no redundant second call) — this is the correct pattern
    const rankedUp = leveledUp ? checkRankUp(5, newLevel) : false;
    expect(rankedUp).toBe(true);
  });

  it("does NOT detect rank-up when leveling within same rank (D→D)", () => {
    // Level 6→7: both in D rank (levels 6-15)
    const xpAtLevel6 = getTotalXPForLevel(6);
    const xpNeededToReachLevel7 = getTotalXPForLevel(7) - xpAtLevel6 + 1;

    const { leveledUp, newLevel } = checkLevelUp(xpAtLevel6, xpNeededToReachLevel7);
    expect(leveledUp).toBe(true);
    const rankedUp = leveledUp ? checkRankUp(6, newLevel) : false;
    expect(rankedUp).toBe(false);
  });
});

// ─── HIGH-3: coins_earned achievement ─────────────────────────────────────────

// Profile stub — only required fields from src/types/game.ts Profile interface
const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "test-user",
  hunter_name: "Hunter",
  avatar_id: "1",
  level: 1,
  rank: "E",
  total_xp: 0,
  coins: 0,
  str_xp: 0,
  int_xp: 0,
  cha_xp: 0,
  dis_xp: 0,
  wlt_xp: 0,
  hidden_xp: 0,
  total_quests_completed: 0,
  current_streak: 0,
  longest_streak: 0,
  active_debuffs: [],
  rest_days_used_this_week: 0,
  onboarding_completed: false,
  ...overrides,
});

describe("evaluateCondition - coins_earned", () => {
  it("does NOT unlock when totalCoinsEarned is below threshold", () => {
    const profile = makeProfile({ coins: 1000 }); // high balance, but low total earned
    const result = evaluateCondition(
      { type: "coins_earned", total: 500 },
      { profile, totalCoinsEarned: 10 }, // below threshold
    );
    expect(result).toBe(false);
  });

  it("unlocks when totalCoinsEarned exceeds threshold even if current balance is low", () => {
    const profile = makeProfile({ coins: 10 }); // spent most coins
    const result = evaluateCondition(
      { type: "coins_earned", total: 500 },
      { profile, totalCoinsEarned: 600 },
    );
    expect(result).toBe(true);
  });

  it("falls back to profile.coins when totalCoinsEarned is not provided", () => {
    const profile = makeProfile({ coins: 600 });
    const result = evaluateCondition(
      { type: "coins_earned", total: 500 },
      { profile }, // no totalCoinsEarned
    );
    expect(result).toBe(true);
  });
});
