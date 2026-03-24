// Game mechanic types — Система Пробуждения

export interface Attributes {
  strength: number;   // STR — Физическое здоровье
  intellect: number;  // INT — Знания и навыки
  charisma: number;   // CHA — Коммуникация и влияние
  discipline: number; // DIS — Воля и самоконтроль
  wealth: number;     // WLT — Финансы и карьера
  hidden?: number;    // ??? — Открывается на уровне 10
}

export type AttributeKey = "str" | "int" | "cha" | "dis" | "wlt" | "hidden";

export type QuestType = "daily" | "weekly" | "epic" | "tutorial";
export type QuestDifficulty = "easy" | "medium" | "hard" | "legendary";

export interface Subquest {
  id: string;
  quest_id: string;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
}

export interface Quest {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  attribute: AttributeKey;
  xp_reward: number;
  coin_reward: number;
  is_active: boolean;
  is_completed: boolean;
  is_recurring: boolean;
  last_reset_date?: string;
  sort_order: number;
  streak: number;

  // Habit science fields
  trigger_time?: string;      // "07:30"
  trigger_location?: string;  // "Дома"
  trigger_anchor?: string;    // "После кофе"
  min_description?: string;   // "Хотя бы 5 отжиманий"

  // NCT System (Goal Linking)
  parent_id?: string;
  narrative?: string;
  synergy_points?: number;
  linked_tasks?: Quest[]; // For UI rendering of children

  // Epic quests only
  subquests?: Subquest[];
  target_value?: number;
  current_value?: number;
  deadline?: string;
  title_reward?: string;

  created_at: string;
  updated_at: string;
}

export interface Rank {
  id: string;
  name: string;
  levelRange: [number, number];
  color: string;
  trialRequired: boolean;
  trialDescription?: string;
}

export interface Reward {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  cost: number;
  emoji: string;
  cooldown_hours?: number;
  last_redeemed_at?: string;
  is_active: boolean;
  sort_order: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: "habits" | "ranks" | "special" | "hidden";
  icon: string;
  condition: AchievementCondition;
}

export type AchievementCondition =
  | { type: "quests_completed"; count: number }
  | { type: "streak_days"; count: number }
  | { type: "level_reached"; level: number }
  | { type: "rank_reached"; rank: string }
  | { type: "attribute_points"; attribute: AttributeKey; min: number }
  | { type: "coins_earned"; total: number }
  | { type: "epic_completed" }
  | { type: "rewards_redeemed"; count: number };

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export interface Profile {
  id: string;
  hunter_name: string;
  avatar_id: string;
  level: number;
  total_xp: number;
  rank: string;
  coins: number;
  str_xp: number;
  int_xp: number;
  cha_xp: number;
  dis_xp: number;
  wlt_xp: number;
  hidden_xp: number;
  current_streak: number;
  longest_streak: number;
  total_quests_completed: number;
  rest_days_used_this_week: number;
  streak_shields?: number;
  active_debuffs: Debuff[];
  onboarding_completed: boolean;
  total_coins_earned?: number;

  // Subscription fields
  subscription_tier?: 'hunter' | 'monarch';
  subscription_status?: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

export interface Debuff {
  type: "laziness" | "burnout";
  triggered_at: string;
  xp_penalty?: number; // % penalty (e.g. 25 = -25%)
}

export interface CompleteQuestResult {
  xpEarned: number;
  coinsEarned: number;
  leveledUp: boolean;
  newLevel?: number;
  rankedUp: boolean;
  newRank?: string;
  achievementsUnlocked: string[];
  debuffRemoved?: string;
}

export interface XPProgress {
  level: number;
  currentXP: number;
  requiredXP: number;
  percentage: number;
}

export interface DailyProgress {
  id: string;
  user_id: string;
  date: string;
  quests_total: number;
  quests_completed: number;
  xp_earned: number;
  is_rest_day: boolean;
  completion_rate: number;
}
