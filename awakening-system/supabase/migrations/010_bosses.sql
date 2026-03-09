CREATE TABLE IF NOT EXISTS bosses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  week_start DATE NOT NULL,
  total_quests INT NOT NULL DEFAULT 5,
  completed_quests INT NOT NULL DEFAULT 0,
  is_defeated BOOLEAN DEFAULT false,
  bonus_xp INT DEFAULT 500,
  badge_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE bosses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bosses" ON bosses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX bosses_user_week_idx ON bosses(user_id, week_start);
