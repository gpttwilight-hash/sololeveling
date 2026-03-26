-- 020_habit_rewards.sql
-- Adds habit frequency + reward fields to quests,
-- creates habit_weeks tracking table,
-- adds source field to reward_logs.

-- 1. New columns on quests
ALTER TABLE quests ADD COLUMN frequency_per_week INTEGER NOT NULL DEFAULT 7;
ALTER TABLE quests ADD COLUMN reward_emoji TEXT;
ALTER TABLE quests ADD COLUMN reward_title TEXT;

-- Constrain frequency to 1-7
ALTER TABLE quests ADD CONSTRAINT quests_frequency_check
  CHECK (frequency_per_week >= 1 AND frequency_per_week <= 7);

-- 2. habit_weeks table
CREATE TABLE habit_weeks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id      UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start    DATE NOT NULL,
  target        INTEGER NOT NULL,
  completions   INTEGER NOT NULL DEFAULT 0,
  is_success    BOOLEAN NOT NULL DEFAULT FALSE,
  reward_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  claimed_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),

  UNIQUE(quest_id, week_start)
);

-- RLS for habit_weeks
ALTER TABLE habit_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habit_weeks"
  ON habit_weeks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit_weeks"
  ON habit_weeks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit_weeks"
  ON habit_weeks FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. Source field on reward_logs
ALTER TABLE reward_logs ADD COLUMN source TEXT NOT NULL DEFAULT 'shop';
