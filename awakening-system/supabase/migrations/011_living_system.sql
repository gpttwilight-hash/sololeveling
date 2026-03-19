-- supabase/migrations/011_living_system.sql

-- 1. daily_dispatch: одна запись на пользователя на день
CREATE TABLE IF NOT EXISTS daily_dispatch (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  template_id     TEXT NOT NULL,
  narrative_text  TEXT NOT NULL,
  bonus_quest_title TEXT NOT NULL,
  bonus_quest_xp  INT NOT NULL DEFAULT 30,
  bonus_quest_coins INT NOT NULL DEFAULT 15,
  attribute_focus TEXT NOT NULL CHECK (attribute_focus IN ('str','int','cha','dis','wlt')),
  is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

ALTER TABLE daily_dispatch ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own dispatch" ON daily_dispatch
  FOR ALL USING (auth.uid() = user_id);

-- 2. portal_templates: глобальный пул порталов
CREATE TABLE IF NOT EXISTS portal_templates (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  attribute   TEXT NOT NULL CHECK (attribute IN ('str','int','cha','dis','wlt')),
  step1_title TEXT NOT NULL,
  step1_desc  TEXT,
  step1_xp    INT NOT NULL DEFAULT 20,
  step2_title TEXT NOT NULL,
  step2_desc  TEXT,
  step2_xp    INT NOT NULL DEFAULT 30,
  step3_title TEXT NOT NULL,
  step3_desc  TEXT,
  step3_xp    INT NOT NULL DEFAULT 50,
  badge_name  TEXT NOT NULL,
  total_xp    INT GENERATED ALWAYS AS (step1_xp + step2_xp + step3_xp) STORED
);

ALTER TABLE portal_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read portal templates" ON portal_templates
  FOR SELECT USING (auth.role() = 'authenticated');

-- 3. user_portal_progress: прогресс пользователя по порталу дня
CREATE TABLE IF NOT EXISTS user_portal_progress (
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  template_id     TEXT NOT NULL,
  steps_completed INT NOT NULL DEFAULT 0 CHECK (steps_completed BETWEEN 0 AND 3),
  is_finished     BOOLEAN NOT NULL DEFAULT FALSE,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  finished_at     TIMESTAMPTZ,
  PRIMARY KEY (user_id, date)
);

ALTER TABLE user_portal_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own portal progress" ON user_portal_progress
  FOR ALL USING (auth.uid() = user_id);

-- 4. Добавить milestone tracking в profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_milestone_shown INT NOT NULL DEFAULT 0;

-- 5. Индексы
CREATE INDEX IF NOT EXISTS idx_daily_dispatch_user_date ON daily_dispatch(user_id, date);
CREATE INDEX IF NOT EXISTS idx_portal_progress_user_date ON user_portal_progress(user_id, date);
