import { describe, it, expect } from "vitest";
import { checkLevelUp } from "@/lib/game/level-system";
import { checkRankUp } from "@/lib/game/rank-system";
import { getTotalXPForLevel } from "@/lib/game/xp-calculator";

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
