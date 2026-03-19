import { describe, it, expect } from "vitest";
import { getAuraState } from "@/lib/game/aura-calculator";

const base = { str_xp: 10, int_xp: 10, cha_xp: 10, dis_xp: 10, wlt_xp: 10 };

describe("getAuraState", () => {
  it("returns 'dim' for streak 0", () => {
    expect(getAuraState({ ...base, current_streak: 0 }).intensity).toBe("dim");
  });
  it("returns 'dim' for streak 1-2", () => {
    expect(getAuraState({ ...base, current_streak: 2 }).intensity).toBe("dim");
  });
  it("returns 'flicker' for streak 3-6", () => {
    expect(getAuraState({ ...base, current_streak: 4 }).intensity).toBe("flicker");
  });
  it("returns 'pulse' for streak 7-13", () => {
    expect(getAuraState({ ...base, current_streak: 7 }).intensity).toBe("pulse");
  });
  it("returns 'radiate' for streak 14+", () => {
    expect(getAuraState({ ...base, current_streak: 14 }).intensity).toBe("radiate");
  });
  it("returns color of top attribute", () => {
    const state = getAuraState({ ...base, str_xp: 100, current_streak: 7 });
    expect(state.primaryColor).toBe("#E84855");
  });
  it("returns secondary color only when radiate", () => {
    const state = getAuraState({ str_xp: 100, int_xp: 80, cha_xp: 10, dis_xp: 10, wlt_xp: 10, current_streak: 14 });
    expect(state.secondaryColor).toBe("#3B82F6");
  });
  it("returns null secondaryColor for non-radiate", () => {
    const state = getAuraState({ ...base, current_streak: 7 });
    expect(state.secondaryColor).toBeNull();
  });
});
