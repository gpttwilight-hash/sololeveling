-- ============================================================
-- Migration: 002_add_recurring.sql
-- Adds recurring quest support and last_reset_date tracking
-- ============================================================

-- Add recurring flag to quests
ALTER TABLE quests ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

-- Track the last date the quest was reset, for idempotent resets
ALTER TABLE quests ADD COLUMN IF NOT EXISTS last_reset_date DATE;
