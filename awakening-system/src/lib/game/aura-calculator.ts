export type AuraIntensity = "dim" | "flicker" | "pulse" | "radiate";

export interface AuraState {
  intensity: AuraIntensity;
  primaryColor: string;
  secondaryColor: string | null;
}

const ATTR_COLORS: Record<string, string> = {
  str: "#E84855",
  int: "#3B82F6",
  cha: "#F59E0B",
  dis: "#8B5CF6",
  wlt: "#10B981",
};

interface ProfileForAura {
  current_streak: number;
  str_xp: number;
  int_xp: number;
  cha_xp: number;
  dis_xp: number;
  wlt_xp: number;
}

export function getAuraState(profile: ProfileForAura): AuraState {
  const streak = profile.current_streak;

  const intensity: AuraIntensity =
    streak <= 2 ? "dim" :
    streak <= 6 ? "flicker" :
    streak <= 13 ? "pulse" :
    "radiate";

  const attrs = [
    { key: "str", xp: profile.str_xp },
    { key: "int", xp: profile.int_xp },
    { key: "cha", xp: profile.cha_xp },
    { key: "dis", xp: profile.dis_xp },
    { key: "wlt", xp: profile.wlt_xp },
  ].sort((a, b) => b.xp - a.xp);

  const primaryColor = ATTR_COLORS[attrs[0].key];
  const secondaryColor = intensity === "radiate" ? ATTR_COLORS[attrs[1].key] : null;

  return { intensity, primaryColor, secondaryColor };
}
