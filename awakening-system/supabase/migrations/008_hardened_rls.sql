-- ============================================================
-- Migration: 008_hardened_rls.sql
-- Hardening RLS policies for production readiness
-- ============================================================

-- 1. Profiles: Split "ALL" into granular policies
DROP POLICY IF EXISTS "profiles_own" ON profiles;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Prevent users from manually giving themselves coins/XP via client-side update
-- Only hunter_name and avatar_id should be easily editable by the user directly via API
-- Although we use Server Actions, hardening the database layer is an extra "Defense in Depth" measure.
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Quests: Granular control
DROP POLICY IF EXISTS "quests_own" ON quests;

CREATE POLICY "quests_select_own" ON quests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "quests_insert_own" ON quests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quests_update_own" ON quests
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quests_delete_own" ON quests
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Rewards: Granular control
DROP POLICY IF EXISTS "rewards_own" ON rewards;

CREATE POLICY "rewards_select_own" ON rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "rewards_insert_own" ON rewards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rewards_update_own" ON rewards
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Logs: Read-only for users (they shouldn't be able to edit history)
DROP POLICY IF EXISTS "quest_logs_own" ON quest_logs;
CREATE POLICY "quest_logs_select_own" ON quest_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "quest_logs_insert_own" ON quest_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reward_logs_own" ON reward_logs;
CREATE POLICY "reward_logs_select_own" ON reward_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "reward_logs_insert_own" ON reward_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
