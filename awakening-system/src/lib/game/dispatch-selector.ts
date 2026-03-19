import {
  DISPATCH_TEMPLATES,
  getAttributeOfDay,
  type DispatchTemplate,
  type StreakBand,
  type AttributeKey,
  type RankTier,
} from "./dispatch-templates";

export { getAttributeOfDay };

export interface DispatchResult {
  id: string;
  narrativeText: string;
  bonusQuestTitle: string;
  bonusQuestAttribute: AttributeKey;
  resolvedAttribute: AttributeKey;
  bonusXP: number;
  bonusCoins: number;
}

export function getStreakBand(streak: number): StreakBand {
  if (streak === 0) return "zero";
  if (streak <= 2) return "early";
  if (streak <= 6) return "growing";
  if (streak <= 13) return "strong";
  if (streak <= 29) return "veteran";
  return "legend";
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface ProfileForDispatch {
  rank: string;
  current_streak: number;
  str_xp: number;
  int_xp: number;
  cha_xp: number;
  dis_xp: number;
  wlt_xp: number;
}

export function selectDispatch(
  profile: ProfileForDispatch,
  date: Date
): DispatchResult {
  const attributeOfDay = getAttributeOfDay(date);
  const streakBand = getStreakBand(profile.current_streak);
  const rankTier = profile.rank as RankTier;

  const exactMatch = DISPATCH_TEMPLATES.filter(
    (t) => t.rankTier === rankTier && t.streakBand === streakBand
  );
  const streakMatch = DISPATCH_TEMPLATES.filter(
    (t) => t.rankTier === "any" && t.streakBand === streakBand
  );
  const rankMatch = DISPATCH_TEMPLATES.filter(
    (t) => t.rankTier === rankTier && t.streakBand === "any"
  );
  const anyMatch = DISPATCH_TEMPLATES.filter(
    (t) => t.rankTier === "any" && t.streakBand === "any"
  );

  const pool =
    exactMatch.length > 0 ? exactMatch :
    streakMatch.length > 0 ? streakMatch :
    rankMatch.length > 0 ? rankMatch :
    anyMatch;

  const dateKey = date.toISOString().split("T")[0];
  const hash = simpleHash(dateKey);
  const template = pool[hash % pool.length];

  const resolvedAttribute: AttributeKey =
    template.bonusQuestAttribute === "focus"
      ? attributeOfDay
      : (template.bonusQuestAttribute as AttributeKey);

  const bonusXP = 45;
  const bonusCoins = Math.ceil(bonusXP * 0.5);

  return {
    id: template.id,
    narrativeText: template.narrativeText,
    bonusQuestTitle: template.bonusQuestTitle,
    bonusQuestAttribute: resolvedAttribute,
    resolvedAttribute: attributeOfDay,
    bonusXP,
    bonusCoins,
  };
}
