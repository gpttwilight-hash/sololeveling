import type { Rank } from "@/types/game";

// XP scaling formula: baseXP * (level ^ scalingFactor)
export const XP_CONFIG = {
  baseXP: 100,
  scalingFactor: 1.3,
  maxLevel: 100,
} as const;

// XP rewards by difficulty
export const XP_BY_DIFFICULTY = {
  easy:      { min: 5,  max: 10  },
  medium:    { min: 10, max: 20  },
  hard:      { min: 20, max: 50  },
  legendary: { min: 50, max: 150 },
} as const;

// Default XP for each difficulty (midpoint)
export const DEFAULT_XP: Record<string, number> = {
  easy:      8,
  medium:    15,
  hard:      30,
  legendary: 80,
};

// Coins = XP * 0.5, rounded up
export const COIN_MULTIPLIER = 0.5;

// Anti-grind
export const ANTI_GRIND = {
  restDaysPerWeek: 1,
  recoveryThreshold: 2,         // days before recovery mission triggers
  recoveryTasksNeeded: 3,       // out of 5 quests
  lazinessTrigger: 3,           // consecutive missed days
  lazinessPenalty: 25,          // % XP penalty
  lazinessDuration: 7,          // days
  lazinessCure: 3,              // consecutive full days to remove
  burnoutTrigger: 14,           // days at 100% without rest
} as const;

// Rank definitions (PRD §5.3)
export const RANKS: Rank[] = [
  {
    id: "E",
    name: "Пробуждённый",
    levelRange: [1, 5],
    color: "#6B7280",
    trialRequired: false,
  },
  {
    id: "D",
    name: "Охотник",
    levelRange: [6, 15],
    color: "#3B82F6",
    trialRequired: true,
    trialDescription: "Продержать все базовые привычки 30 дней подряд",
  },
  {
    id: "C",
    name: "Ветеран",
    levelRange: [16, 30],
    color: "#8B5CF6",
    trialRequired: true,
    trialDescription: "Заработать первые деньги с нового навыка ИЛИ пробежать 10 км",
  },
  {
    id: "B",
    name: "Элита",
    levelRange: [31, 50],
    color: "#F59E0B",
    trialRequired: true,
    trialDescription: "Стабильный доход 3 месяца подряд ИЛИ завершить трансформацию тела",
  },
  {
    id: "A",
    name: "Мастер",
    levelRange: [51, 75],
    color: "#EF4444",
    trialRequired: true,
    trialDescription: "Менторить других ИЛИ создать продукт с 1000+ пользователями",
  },
  {
    id: "S",
    name: "Монарх",
    levelRange: [76, 100],
    color: "#FBBF24",
    trialRequired: true,
    trialDescription: "Определяешь сам. S-ранг знает свой путь.",
  },
];
