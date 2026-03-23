-- Migration: 019_add_tutorial_quest_type.sql
-- Extends quests.type check constraint to allow 'tutorial' type.
-- The original constraint was created inline in 001_initial_schema.sql.
-- PostgreSQL auto-names inline column CHECK constraints as {table}_{column}_check,
-- so the auto-generated name is 'quests_type_check'.
-- We also drop 'quests_type_check1' (alternate auto-name) for safety.

ALTER TABLE quests DROP CONSTRAINT IF EXISTS quests_type_check;
ALTER TABLE quests DROP CONSTRAINT IF EXISTS quests_type_check1;
ALTER TABLE quests ADD CONSTRAINT quests_type_check
  CHECK (type IN ('daily', 'weekly', 'epic', 'tutorial'));
