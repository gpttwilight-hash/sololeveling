-- Migration: 018_complete_quest_rpc.sql
-- Atomic quest completion: prevents XP duplication via FOR UPDATE lock.
-- XP and coin values are pre-computed in the JS layer (with debuff applied)
-- and passed as parameters.

CREATE OR REPLACE FUNCTION complete_quest(
  p_quest_id        uuid,
  p_user_id         uuid,
  p_xp_earned       integer,
  p_coins_earned    integer,
  p_attr_column     text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_quest record;
BEGIN
  -- Validate attribute column to prevent SQL injection
  IF p_attr_column NOT IN ('str_xp', 'int_xp', 'cha_xp', 'dis_xp', 'wlt_xp', 'hidden_xp') THEN
    RAISE EXCEPTION 'Invalid attribute column: %', p_attr_column;
  END IF;

  -- Lock quest row — prevents concurrent completions (FOR UPDATE blocks until first tx commits)
  SELECT * INTO v_quest
  FROM quests
  WHERE id = p_quest_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quest not found';
  END IF;

  IF v_quest.is_completed THEN
    RAISE EXCEPTION 'Quest already completed';
  END IF;

  -- Atomic: mark quest complete
  UPDATE quests
  SET is_completed = true,
      streak = COALESCE(streak, 0) + 1
  WHERE id = p_quest_id;

  -- Atomic: update all profile columns in one statement
  EXECUTE format(
    'UPDATE profiles SET
       total_xp                = total_xp + $1,
       coins                   = coins + $2,
       total_quests_completed  = total_quests_completed + 1,
       total_coins_earned      = COALESCE(total_coins_earned, 0) + $2,
       %I                      = COALESCE(%I, 0) + $1
     WHERE id = $3',
    p_attr_column, p_attr_column
  ) USING p_xp_earned, p_coins_earned, p_user_id;
END;
$$;

-- Restrict to authenticated users
REVOKE ALL ON FUNCTION complete_quest(uuid, uuid, integer, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION complete_quest(uuid, uuid, integer, integer, text) TO authenticated;
