-- Migration: 017_rewards_delete_policy.sql
-- Add missing DELETE policy for rewards table.
-- Do NOT edit 008_hardened_rls.sql retroactively.

CREATE POLICY "rewards_delete_own" ON rewards
  FOR DELETE USING (auth.uid() = user_id);
