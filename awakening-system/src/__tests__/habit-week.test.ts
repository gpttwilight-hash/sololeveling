import { describe, it, expect } from "vitest";
import {
  getWeekStart,
  shouldResetQuest,
  computeWeeklyStreak,
} from "../lib/game/habit-week";

describe("getWeekStart", () => {
  it("returns Monday for a Wednesday", () => {
    // 2026-03-25 is Wednesday
    const result = getWeekStart(new Date("2026-03-25T12:00:00"));
    expect(result).toBe("2026-03-23");
  });

  it("returns Monday for a Monday", () => {
    const result = getWeekStart(new Date("2026-03-23T08:00:00"));
    expect(result).toBe("2026-03-23");
  });

  it("returns Monday for a Sunday", () => {
    // 2026-03-29 is Sunday
    const result = getWeekStart(new Date("2026-03-29T23:59:00"));
    expect(result).toBe("2026-03-23");
  });

  it("returns Monday for a Saturday", () => {
    // 2026-03-28 is Saturday
    const result = getWeekStart(new Date("2026-03-28T10:00:00"));
    expect(result).toBe("2026-03-23");
  });
});

describe("shouldResetQuest", () => {
  const today = "2026-03-25";

  it("resets daily (7/7) quest when last_reset_date < today", () => {
    expect(shouldResetQuest("2026-03-24", today, 7, 0)).toBe(true);
  });

  it("does not reset if already reset today", () => {
    expect(shouldResetQuest(today, today, 7, 0)).toBe(false);
  });

  it("resets habit quest (3/7) when weekly target not met", () => {
    expect(shouldResetQuest("2026-03-24", today, 3, 2)).toBe(true);
  });

  it("does not reset habit quest (3/7) when weekly target met", () => {
    expect(shouldResetQuest("2026-03-24", today, 3, 3)).toBe(false);
  });

  it("does not reset habit quest when target exceeded", () => {
    expect(shouldResetQuest("2026-03-24", today, 3, 5)).toBe(false);
  });

  it("resets when last_reset_date is null", () => {
    expect(shouldResetQuest(null, today, 3, 1)).toBe(true);
  });

  it("resets daily quest when last_reset_date is null", () => {
    expect(shouldResetQuest(null, today, 7, 0)).toBe(true);
  });
});

describe("computeWeeklyStreak", () => {
  it("increments streak when previous week was successful (freq < 7)", () => {
    expect(computeWeeklyStreak(3, 3, true)).toBe(4);
  });

  it("resets streak to 0 when previous week failed (freq < 7)", () => {
    expect(computeWeeklyStreak(5, 3, false)).toBe(0);
  });

  it("resets streak to 0 when no previous week (freq < 7)", () => {
    expect(computeWeeklyStreak(0, 3, null)).toBe(0);
  });

  it("leaves streak unchanged for daily quests (freq = 7)", () => {
    expect(computeWeeklyStreak(10, 7, true)).toBe(10);
    expect(computeWeeklyStreak(10, 7, false)).toBe(10);
    expect(computeWeeklyStreak(10, 7, null)).toBe(10);
  });
});
