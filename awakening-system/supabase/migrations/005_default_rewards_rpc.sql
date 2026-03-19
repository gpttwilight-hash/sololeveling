-- ============================================================
-- Migration: 005_default_rewards_rpc.sql
-- Adds RPC to insert default rewards for new users
-- ============================================================

CREATE OR REPLACE FUNCTION insert_default_rewards(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO rewards (user_id, title, cost, emoji, sort_order, is_active)
  VALUES
    (p_user_id, 'Вкусный ужин', 50, '🍕', 0, TRUE),
    (p_user_id, '1 час видеоигр', 30, '🎮', 1, TRUE),
    (p_user_id, 'Просмотр фильма', 40, '🎬', 2, TRUE),
    (p_user_id, 'Покупка новой книги', 60, '📚', 3, TRUE),
    (p_user_id, 'Вечер отдыха (без квестов)', 100, '🛌', 4, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
