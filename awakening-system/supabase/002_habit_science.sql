-- ============================================================
-- Migration 002: Habit Science Features
-- Запусти в Supabase SQL Editor
-- ============================================================

-- Trigger fields for quests (implementation intentions)
ALTER TABLE quests
  ADD COLUMN IF NOT EXISTS trigger_time    TEXT,          -- "07:30"
  ADD COLUMN IF NOT EXISTS trigger_location TEXT,         -- "Дома / В зале"
  ADD COLUMN IF NOT EXISTS trigger_anchor   TEXT,         -- "После кофе"
  ADD COLUMN IF NOT EXISTS min_description  TEXT;         -- "Хотя бы 5 отжиманий"

-- Streak shields for profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS streak_shields  INTEGER DEFAULT 1;
