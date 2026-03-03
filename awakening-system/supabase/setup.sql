-- ============================================================
-- Система Пробуждения — Full Setup (schema + seed + fix users)
-- Запусти этот файл целиком в Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hunter_name TEXT NOT NULL,
  avatar_id TEXT DEFAULT 'default',
  level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'E',
  coins INTEGER DEFAULT 0,
  str_xp INTEGER DEFAULT 0,
  int_xp INTEGER DEFAULT 0,
  cha_xp INTEGER DEFAULT 0,
  dis_xp INTEGER DEFAULT 0,
  wlt_xp INTEGER DEFAULT 0,
  hidden_xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_quests_completed INTEGER DEFAULT 0,
  rest_days_used_this_week INTEGER DEFAULT 0,
  active_debuffs JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- QUESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS quests (
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
  target_value FLOAT,
  current_value FLOAT DEFAULT 0,
  deadline TIMESTAMPTZ,
  title_reward TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUBQUESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS subquests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0
);

-- ============================================================
-- QUEST LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS quest_logs (
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
-- DAILY PROGRESS
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_progress (
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
-- ACHIEVEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('habits', 'ranks', 'special', 'hidden')),
  icon TEXT NOT NULL,
  condition JSONB NOT NULL
);

-- ============================================================
-- USER ACHIEVEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ============================================================
-- REWARDS
-- ============================================================

CREATE TABLE IF NOT EXISTS rewards (
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
-- REWARD LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS reward_logs (
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

CREATE TABLE IF NOT EXISTS user_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('rank', 'epic_quest', 'achievement')),
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_quest_logs_user_date ON quest_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_quest_logs_date ON quest_logs(date);
CREATE INDEX IF NOT EXISTS idx_daily_progress_user_date ON daily_progress(user_id, date);
CREATE INDEX IF NOT EXISTS idx_quests_user_type ON quests(user_id, type);
CREATE INDEX IF NOT EXISTS idx_quests_user_active ON quests(user_id, is_active);

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

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS quests_updated_at ON quests;
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
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_own" ON profiles;
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "quests_own" ON quests;
CREATE POLICY "quests_own" ON quests FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "subquests_own" ON subquests;
CREATE POLICY "subquests_own" ON subquests FOR ALL USING (
  EXISTS (SELECT 1 FROM quests WHERE quests.id = subquests.quest_id AND quests.user_id = auth.uid())
);

DROP POLICY IF EXISTS "quest_logs_own" ON quest_logs;
CREATE POLICY "quest_logs_own" ON quest_logs FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_progress_own" ON daily_progress;
CREATE POLICY "daily_progress_own" ON daily_progress FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_achievements_own" ON user_achievements;
CREATE POLICY "user_achievements_own" ON user_achievements FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "rewards_own" ON rewards;
CREATE POLICY "rewards_own" ON rewards FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reward_logs_own" ON reward_logs;
CREATE POLICY "reward_logs_own" ON reward_logs FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_titles_own" ON user_titles;
CREATE POLICY "user_titles_own" ON user_titles FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "achievements_read_all" ON achievements;
CREATE POLICY "achievements_read_all" ON achievements FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, hunter_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'hunter_name', 'Охотник'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED: ACHIEVEMENTS
-- ============================================================

INSERT INTO achievements (id, title, description, category, icon, condition) VALUES
('first_step',        'Первый шаг',         'Выполни свой первый квест',                 'habits', '👣', '{"type":"quests_completed","count":1}'),
('ten_quests',        'В ритме',            'Выполни 10 квестов',                        'habits', '⚡', '{"type":"quests_completed","count":10}'),
('fifty_quests',      'Машина квестов',     'Выполни 50 квестов',                        'habits', '🔥', '{"type":"quests_completed","count":50}'),
('hundred_quests',    'Ветеран квестов',    'Выполни 100 квестов',                       'habits', '💯', '{"type":"quests_completed","count":100}'),
('week_streak',       'Неделя огня',        'Поддерживай streak 7 дней подряд',         'habits', '🔥', '{"type":"streak_days","count":7}'),
('month_streak',      'Марафонец',          'Поддерживай streak 30 дней подряд',        'habits', '🏃', '{"type":"streak_days","count":30}'),
('hundred_streak',    'Легенда дисциплины', 'Поддерживай streak 100 дней подряд',       'habits', '👑', '{"type":"streak_days","count":100}'),
('early_riser',       'Мастер утра',        'Выполни 30 утренних квестов',              'habits', '🌅', '{"type":"quests_completed","count":30}'),
('gym_rat',           'Железный человек',   'Набери 100 очков силы (STR)',              'habits', '💪', '{"type":"attribute_points","attribute":"str","min":100}'),
('bookworm',          'Хранитель знаний',   'Набери 100 очков интеллекта (INT)',        'habits', '📚', '{"type":"attribute_points","attribute":"int","min":100}'),
('discipline_master', 'Воля железа',        'Набери 100 очков дисциплины (DIS)',        'habits', '🧘', '{"type":"attribute_points","attribute":"dis","min":100}'),
('awakened',          'Пробуждённый',       'Начни свой путь — получи Систему',         'ranks',  '⭐', '{"type":"level_reached","level":1}'),
('rank_d',            'Охотник',            'Достигни D-ранга',                          'ranks',  '🔵', '{"type":"rank_reached","rank":"D"}'),
('rank_c',            'Ветеран',            'Достигни C-ранга',                          'ranks',  '🟣', '{"type":"rank_reached","rank":"C"}'),
('rank_b',            'Элита',              'Достигни B-ранга',                          'ranks',  '🟡', '{"type":"rank_reached","rank":"B"}'),
('rank_a',            'Мастер',             'Достигни A-ранга',                          'ranks',  '🔴', '{"type":"rank_reached","rank":"A"}'),
('rank_s',            'Монарх',             'Достигни S-ранга — вершина системы',        'ranks',  '👑', '{"type":"rank_reached","rank":"S"}'),
('level_10',          'В потоке',           'Достигни 10-го уровня',                     'ranks',  '🎯', '{"type":"level_reached","level":10}'),
('level_25',          'Опытный охотник',    'Достигни 25-го уровня',                     'ranks',  '⚔️',  '{"type":"level_reached","level":25}'),
('level_50',          'Полумиф',            'Достигни 50-го уровня',                     'ranks',  '🌟', '{"type":"level_reached","level":50}'),
('first_epic',        'Покоритель данжей',  'Заверши свой первый эпический квест',       'special','⚔️',  '{"type":"epic_completed"}'),
('shopaholic',        'Заслужил отдых',     'Используй награду из магазина 10 раз',      'special','🛒', '{"type":"rewards_redeemed","count":10}'),
('big_spender',       'Большая трата',      'Потрать 1000 монет на награды',             'special','💰', '{"type":"coins_earned","total":1000}'),
('all_attributes',    'Гармония',           'Набери минимум 20 очков во всех атрибутах', 'special','⚖️',  '{"type":"attribute_points","attribute":"wlt","min":20}'),
('shadow_monarch',    '???',                'Тайна, скрытая в глубинах Системы',         'hidden', '🌑', '{"type":"level_reached","level":76}'),
('true_awakening',    '???',                'Ты видишь то, что другие не замечают',      'hidden', '👁️',  '{"type":"streak_days","count":50}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED: FUNCTION insert_default_rewards
-- ============================================================

CREATE OR REPLACE FUNCTION insert_default_rewards(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO rewards (user_id, title, emoji, cost, sort_order) VALUES
    (p_user_id, 'Заказать еду',        '🍕', 100,  1),
    (p_user_id, 'Час развлечений',     '🎮', 200,  2),
    (p_user_id, 'Покупка для хобби',   '🎁', 300,  3),
    (p_user_id, 'День полного отдыха', '😴', 500,  4),
    (p_user_id, 'Крупная покупка',     '🛍️', 1000, 5);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FIX: Создать профили для уже зарегистрированных пользователей
-- (тех, кто зарегистрировался до запуска миграции)
-- ============================================================

INSERT INTO profiles (id, hunter_name)
SELECT id, COALESCE(raw_user_meta_data->>'hunter_name', 'Охотник')
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);
