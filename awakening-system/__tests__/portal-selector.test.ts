import { describe, it, expect } from "vitest";
import { getPortalForDate } from "@/lib/game/portal-templates";

describe("getPortalForDate", () => {
  it("returns a portal template", () => {
    const portal = getPortalForDate(new Date("2026-01-01"));
    expect(portal).toHaveProperty("id");
    expect(portal).toHaveProperty("steps");
    expect(portal.steps).toHaveLength(3);
  });
  it("is deterministic for the same date", () => {
    const d = new Date("2026-03-11");
    expect(getPortalForDate(d).id).toBe(getPortalForDate(d).id);
  });
  it("returns different portals for different dates", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 14; i++) {
      const d = new Date(2026, 0, i + 1);
      ids.add(getPortalForDate(d).id);
    }
    expect(ids.size).toBeGreaterThan(1);
  });
  it("each step has title, description and positive xp", () => {
    const portal = getPortalForDate(new Date("2026-06-15"));
    portal.steps.forEach((step) => {
      expect(step.title).toBeTruthy();
      expect(step.xp).toBeGreaterThan(0);
    });
  });
});
