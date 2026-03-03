-- ============================================================
-- Система Пробуждения — Initial Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES (extends Supabase Auth)
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hunter_name TEXT NOT NULL,
  avatar_id TEXT DEFAULT 'default',
  level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'E',
  coins INTEGER DEFAULT 0,

  -- Attribute XP pools
  str_xp INTEGER DEFAULT 0,
  int_xp INTEGER DEFAULT 0,
  cha_xp INTEGER DEFAULT 0,
  dis_xp INTEGER DEFAULT 0,
  wlt_xp INTEGER DEFAULT 0,
  hidden_xp INTEGER DEFAULT 0,

  -- Streaks & stats
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_quests_completed INTEGER DEFAULT 0,
  rest_days_used_this_week INTEGER DEFAULT 0,

  -- Debuffs (JSON array of active debuffs)
  active_debuffs JSONB DEFAULT '[]',

  -- Settings
  settings JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- QUESTS
-- ============================================================

CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'epic')),
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'legendary')),
  attribute TEXT NOT NULL CHECK (attribute IN ('str', 'int', 'cha', 'dis', 'wlt', 'hidden')),
  xp_reward INTEGER NOT NULL,
  coin_reward INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_completed BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,

  -- Epic quest fields
  target_value FLOAT,
  current_value FLOAT DEFAULT 0,
  deadline TIMESTAMPTZ,
  title_reward TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUBQUESTS (for epic quests)
-- ============================================================

CREATE TABLE subquests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0
);

-- ============================================================
-- QUEST LOGS (immutable completion records)
-- ============================================================

CREATE TABLE quest_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES quests(id) ON DELETE SET NULL,
  quest_title TEXT NOT NULL,
  quest_type TEXT NOT NULL,
  attribute TEXT NOT NULL,
  xp_earned INTEGER NOT NULL,
  coins_earned INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE
);

-- ============================================================
-- DAILY PROGRESS (aggregated per day)
-- ============================================================

CREATE TABLE daily_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  quests_total INTEGER DEFAULT 0,
  quests_completed INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  is_rest_day BOOLEAN DEFAULT FALSE,
  completion_rate FLOAT DEFAULT 0,

  UNIQUE(user_id, date)
);

-- ============================================================
-- ACHIEVEMENTS (global definitions)
-- ============================================================

CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('habits', 'ranks', 'special', 'hidden')),
  icon TEXT NOT NULL,
  condition JSONB NOT NULL
);

-- ============================================================
-- USER ACHIEVEMENTS (unlocked by user)
-- ============================================================

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, achievement_id)
);

-- ============================================================
-- REWARDS (user's reward shop)
-- ============================================================

CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cost INTEGER NOT NULL,
  emoji TEXT DEFAULT '🎁',
  cooldown_hours INTEGER,
  last_redeemed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

-- ============================================================
-- REWARD LOGS (immutable redemption records)
-- ============================================================

CREATE TABLE reward_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES rewards(id) ON DELETE SET NULL,
  reward_title TEXT NOT NULL,
  cost INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER TITLES
-- ============================================================

CREATE TABLE user_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('rank', 'epic_quest', 'achievement')),
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES (PRD §6.2)
-- ============================================================

CREATE INDEX idx_quest_logs_user_date ON quest_logs(user_id, date);
CREATE INDEX idx_quest_logs_date ON quest_logs(date);
CREATE INDEX idx_daily_progress_user_date ON daily_progress(user_id, date);
CREATE INDEX idx_quests_user_type ON quests(user_id, type);
CREATE INDEX idx_quests_user_active ON quests(user_id, is_active);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER quests_updated_at
  BEFORE UPDATE ON quests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE subquests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;

-- Profiles: own data only
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Quests: own data only
CREATE POLICY "quests_own" ON quests
  FOR ALL USING (auth.uid() = user_id);

-- Subquests: via quest ownership
CREATE POLICY "subquests_own" ON subquests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM quests WHERE quests.id = subquests.quest_id AND quests.user_id = auth.uid())
  );

-- Quest logs: own data only
CREATE POLICY "quest_logs_own" ON quest_logs
  FOR ALL USING (auth.uid() = user_id);

-- Daily progress: own data only
CREATE POLICY "daily_progress_own" ON daily_progress
  FOR ALL USING (auth.uid() = user_id);

-- User achievements: own data only
CREATE POLICY "user_achievements_own" ON user_achievements
  FOR ALL USING (auth.uid() = user_id);

-- Rewards: own data only
CREATE POLICY "rewards_own" ON rewards
  FOR ALL USING (auth.uid() = user_id);

-- Reward logs: own data only
CREATE POLICY "reward_logs_own" ON reward_logs
  FOR ALL USING (auth.uid() = user_id);

-- User titles: own data only
CREATE POLICY "user_titles_own" ON user_titles
  FOR ALL USING (auth.uid() = user_id);

-- Achievements table: readable by all authenticated users
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements_read_all" ON achievements
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, hunter_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'hunter_name', 'Охотник'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
