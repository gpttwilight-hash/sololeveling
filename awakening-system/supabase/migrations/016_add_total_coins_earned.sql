-- Migration: 016_add_total_coins_earned.sql
-- Adds lifetime coins tracking column to profiles.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_coins_earned bigint NOT NULL DEFAULT 0;

-- Backfill from existing quest_logs
UPDATE profiles p
SET total_coins_earned = COALESCE((
  SELECT SUM(ql.coins_earned)
  FROM quest_logs ql
  WHERE ql.user_id = p.id
), 0);
