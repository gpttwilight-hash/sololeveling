import { describe, it, expect } from "vitest";
import { selectDispatch, getStreakBand } from "@/lib/game/dispatch-selector";

const baseProfile = {
  rank: "E" as const,
  current_streak: 0,
  str_xp: 10,
  int_xp: 10,
  cha_xp: 10,
  dis_xp: 10,
  wlt_xp: 10,
};

describe("getStreakBand", () => {
  it("returns 'zero' for streak 0", () => {
    expect(getStreakBand(0)).toBe("zero");
  });
  it("returns 'early' for streak 1-2", () => {
    expect(getStreakBand(1)).toBe("early");
    expect(getStreakBand(2)).toBe("early");
  });
  it("returns 'growing' for streak 3-6", () => {
    expect(getStreakBand(3)).toBe("growing");
    expect(getStreakBand(6)).toBe("growing");
  });
  it("returns 'strong' for streak 7-13", () => {
    expect(getStreakBand(7)).toBe("strong");
    expect(getStreakBand(13)).toBe("strong");
  });
  it("returns 'veteran' for streak 14-29", () => {
    expect(getStreakBand(14)).toBe("veteran");
    expect(getStreakBand(29)).toBe("veteran");
  });
  it("returns 'legend' for streak 30+", () => {
    expect(getStreakBand(30)).toBe("legend");
    expect(getStreakBand(200)).toBe("legend");
  });
});

describe("selectDispatch", () => {
  it("returns a dispatch result object with required fields", () => {
    const result = selectDispatch(baseProfile, new Date("2026-01-01"));
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("narrativeText");
    expect(result).toHaveProperty("bonusQuestTitle");
    expect(result).toHaveProperty("bonusQuestAttribute");
    expect(result).toHaveProperty("resolvedAttribute");
    expect(result).toHaveProperty("bonusXP");
    expect(result).toHaveProperty("bonusCoins");
  });

  it("is deterministic — same profile + date → same template", () => {
    const date = new Date("2026-03-11");
    const r1 = selectDispatch(baseProfile, date);
    const r2 = selectDispatch(baseProfile, date);
    expect(r1.id).toBe(r2.id);
  });

  it("varies by date — different dates can produce different templates", () => {
    const results = new Set<string>();
    for (let d = 1; d <= 10; d++) {
      const date = new Date(`2026-01-${String(d).padStart(2, "0")}`);
      results.add(selectDispatch(baseProfile, date).id);
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it("resolvedAttribute is always a valid attribute key", () => {
    const valid = ["str", "int", "cha", "dis", "wlt"];
    const result = selectDispatch(baseProfile, new Date("2026-01-01"));
    expect(valid).toContain(result.resolvedAttribute);
  });

  it("bonusXP is positive", () => {
    const result = selectDispatch(baseProfile, new Date("2026-03-15"));
    expect(result.bonusXP).toBeGreaterThan(0);
  });

  it("bonusCoins is positive", () => {
    const result = selectDispatch(baseProfile, new Date("2026-03-15"));
    expect(result.bonusCoins).toBeGreaterThan(0);
  });
});
