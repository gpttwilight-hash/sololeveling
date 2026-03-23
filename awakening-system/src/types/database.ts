// Supabase Database types for Система Пробуждения
// Run after connecting Supabase:
// npx supabase gen types typescript --project-id YOUR_ID > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type ProfileRow = {
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
  active_debuffs: Json;
  settings: Json;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

type QuestRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: "daily" | "weekly" | "epic" | "tutorial";
  difficulty: "easy" | "medium" | "hard" | "legendary";
  attribute: "str" | "int" | "cha" | "dis" | "wlt" | "hidden";
  xp_reward: number;
  coin_reward: number;
  is_active: boolean;
  is_completed: boolean;
  sort_order: number;
  streak: number;
  target_value: number | null;
  current_value: number;
  deadline: string | null;
  title_reward: string | null;
  created_at: string;
  updated_at: string;
};

type SubquestRow = {
  id: string;
  quest_id: string;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
};

type QuestLogRow = {
  id: string;
  user_id: string;
  quest_id: string | null;
  quest_title: string;
  quest_type: string;
  attribute: string;
  xp_earned: number;
  coins_earned: number;
  completed_at: string;
  date: string;
};

type DailyProgressRow = {
  id: string;
  user_id: string;
  date: string;
  quests_total: number;
  quests_completed: number;
  xp_earned: number;
  is_rest_day: boolean;
  completion_rate: number;
};

type AchievementRow = {
  id: string;
  title: string;
  description: string;
  category: "habits" | "ranks" | "special" | "hidden";
  icon: string;
  condition: Json;
};

type UserAchievementRow = {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
};

type RewardRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cost: number;
  emoji: string;
  cooldown_hours: number | null;
  last_redeemed_at: string | null;
  is_active: boolean;
  sort_order: number;
};

type RewardLogRow = {
  id: string;
  user_id: string;
  reward_id: string | null;
  reward_title: string;
  cost: number;
  redeemed_at: string;
};

type UserTitleRow = {
  id: string;
  user_id: string;
  title: string;
  source: string;
  earned_at: string;
};

type BossRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  week_start: string;
  total_quests: number;
  completed_quests: number;
  is_defeated: boolean;
  bonus_xp: number;
  badge_name: string | null;
  created_at: string;
};

type PushSubscriptionRow = {
  user_id: string;
  subscription: Json;
  updated_at: string;
};

type WaitlistRow = {
  id: string;
  email: string;
  source: string;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string; hunter_name: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      quests: {
        Row: QuestRow;
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          type: "daily" | "weekly" | "epic" | "tutorial";
          attribute: "str" | "int" | "cha" | "dis" | "wlt" | "hidden";
          xp_reward: number;
          coin_reward: number;
          description?: string | null;
          difficulty?: "easy" | "medium" | "hard" | "legendary";
          is_active?: boolean;
          is_completed?: boolean;
          sort_order?: number;
          streak?: number;
          target_value?: number | null;
          current_value?: number;
          deadline?: string | null;
          title_reward?: string | null;
        };
        Update: Partial<QuestRow>;
        Relationships: [];
      };
      subquests: {
        Row: SubquestRow;
        Insert: Omit<SubquestRow, "id"> & { id?: string };
        Update: Partial<SubquestRow>;
        Relationships: [];
      };
      quest_logs: {
        Row: QuestLogRow;
        Insert: {
          user_id: string;
          quest_id?: string | null;
          quest_title: string;
          quest_type: string;
          attribute: string;
          xp_earned: number;
          coins_earned: number;
          date?: string;
          completed_at?: string;
        };
        Update: Partial<QuestLogRow>;
        Relationships: [];
      };
      daily_progress: {
        Row: DailyProgressRow;
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          quests_total?: number;
          quests_completed?: number;
          xp_earned?: number;
          is_rest_day?: boolean;
          completion_rate?: number;
        };
        Update: Partial<DailyProgressRow>;
        Relationships: [];
      };
      achievements: {
        Row: AchievementRow;
        Insert: AchievementRow;
        Update: Partial<AchievementRow>;
        Relationships: [];
      };
      user_achievements: {
        Row: UserAchievementRow;
        Insert: Omit<UserAchievementRow, "id" | "unlocked_at">;
        Update: Partial<UserAchievementRow>;
        Relationships: [];
      };
      rewards: {
        Row: RewardRow;
        Insert: Omit<RewardRow, "id"> & { id?: string };
        Update: Partial<RewardRow>;
        Relationships: [];
      };
      reward_logs: {
        Row: RewardLogRow;
        Insert: Omit<RewardLogRow, "id" | "redeemed_at">;
        Update: Partial<RewardLogRow>;
        Relationships: [];
      };
      user_titles: {
        Row: UserTitleRow;
        Insert: Omit<UserTitleRow, "id" | "earned_at">;
        Update: Partial<UserTitleRow>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: PushSubscriptionRow;
        Insert: PushSubscriptionRow;
        Update: Partial<PushSubscriptionRow>;
        Relationships: [];
      };
      bosses: {
        Row: BossRow;
        Insert: Omit<BossRow, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<BossRow>;
        Relationships: [];
      };
      waitlist: {
        Row: WaitlistRow;
        Insert: { email: string; source?: string };
        Update: Partial<WaitlistRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      insert_default_rewards: {
        Args: { p_user_id: string };
        Returns: void;
      };
      complete_quest: {
        Args: {
          p_quest_id: string;
          p_user_id: string;
          p_xp_earned: number;
          p_coins_earned: number;
          p_attr_column: string;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
}
