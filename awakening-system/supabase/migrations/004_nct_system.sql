-- ============================================================
-- Migration: 004_nct_system.sql
-- Adds Narrative, Commitments, and Tasks (NCT) linking
-- ============================================================

-- 1. Narrative for Epics (what and why we are doing this)
ALTER TABLE quests ADD COLUMN IF NOT EXISTS narrative TEXT;

-- 2. Parent-child relationship (linking tasks to epics)
ALTER TABLE quests ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES quests(id) ON DELETE SET NULL;

-- 3. Synergy Points (earned when completing linked tasks)
ALTER TABLE quests ADD COLUMN IF NOT EXISTS synergy_points INTEGER DEFAULT 0;

-- Index for fast lookup of sub-tasks for an epic
CREATE INDEX IF NOT EXISTS idx_quests_parent_id ON quests(parent_id);
