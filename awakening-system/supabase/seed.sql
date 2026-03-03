-- ============================================================
-- Система Пробуждения — Seed Data
-- ============================================================

-- ============================================================
-- ACHIEVEMENTS (20+ штук, все категории)
-- ============================================================

INSERT INTO achievements (id, title, description, category, icon, condition) VALUES

-- HABITS (привычки)
('first_step',        'Первый шаг',         'Выполни свой первый квест',                          'habits', '👣', '{"type":"quests_completed","count":1}'),
('ten_quests',        'В ритме',            'Выполни 10 квестов',                                 'habits', '⚡', '{"type":"quests_completed","count":10}'),
('fifty_quests',      'Машина квестов',     'Выполни 50 квестов',                                 'habits', '🔥', '{"type":"quests_completed","count":50}'),
('hundred_quests',    'Ветеран квестов',    'Выполни 100 квестов',                                'habits', '💯', '{"type":"quests_completed","count":100}'),
('week_streak',       'Неделя огня',        'Поддерживай streak 7 дней подряд',                  'habits', '🔥', '{"type":"streak_days","count":7}'),
('month_streak',      'Марафонец',          'Поддерживай streak 30 дней подряд',                 'habits', '🏃', '{"type":"streak_days","count":30}'),
('hundred_streak',    'Легенда дисциплины', 'Поддерживай streak 100 дней подряд',                'habits', '👑', '{"type":"streak_days","count":100}'),
('early_riser',       'Мастер утра',        'Выполни 30 утренних квестов (ранний подъём)',        'habits', '🌅', '{"type":"quests_completed","count":30}'),
('gym_rat',           'Железный человек',   'Набери 100 очков силы (STR)',                        'habits', '💪', '{"type":"attribute_points","attribute":"str","min":100}'),
('bookworm',          'Хранитель знаний',   'Набери 100 очков интеллекта (INT)',                  'habits', '📚', '{"type":"attribute_points","attribute":"int","min":100}'),
('discipline_master', 'Воля железа',        'Набери 100 очков дисциплины (DIS)',                  'habits', '🧘', '{"type":"attribute_points","attribute":"dis","min":100}'),

-- RANKS (ранги)
('awakened',          'Пробуждённый',       'Начни свой путь — получи Систему',                  'ranks',  '⭐', '{"type":"level_reached","level":1}'),
('rank_d',            'Охотник',            'Достигни D-ранга',                                   'ranks',  '🔵', '{"type":"rank_reached","rank":"D"}'),
('rank_c',            'Ветеран',            'Достигни C-ранга',                                   'ranks',  '🟣', '{"type":"rank_reached","rank":"C"}'),
('rank_b',            'Элита',              'Достигни B-ранга',                                   'ranks',  '🟡', '{"type":"rank_reached","rank":"B"}'),
('rank_a',            'Мастер',             'Достигни A-ранга',                                   'ranks',  '🔴', '{"type":"rank_reached","rank":"A"}'),
('rank_s',            'Монарх',             'Достигни S-ранга — вершина системы',                 'ranks',  '👑', '{"type":"rank_reached","rank":"S"}'),
('level_10',          'В потоке',           'Достигни 10-го уровня',                              'ranks',  '🎯', '{"type":"level_reached","level":10}'),
('level_25',          'Опытный охотник',    'Достигни 25-го уровня',                              'ranks',  '⚔️',  '{"type":"level_reached","level":25}'),
('level_50',          'Полумиф',            'Достигни 50-го уровня',                              'ranks',  '🌟', '{"type":"level_reached","level":50}'),

-- SPECIAL (особые)
('first_epic',        'Покоритель данжей',  'Заверши свой первый эпический квест',                'special','⚔️',  '{"type":"epic_completed"}'),
('shopaholic',        'Заслужил отдых',     'Используй награду из магазина 10 раз',               'special','🛒', '{"type":"rewards_redeemed","count":10}'),
('big_spender',       'Большая трата',      'Потрать 1000 монет на награды',                      'special','💰', '{"type":"coins_earned","total":1000}'),
('all_attributes',    'Гармония',           'Набери минимум 20 очков во всех атрибутах',          'special','⚖️',  '{"type":"attribute_points","attribute":"wlt","min":20}'),

-- HIDDEN (скрытые)
('shadow_monarch',    '???',                'Тайна, скрытая в глубинах Системы',                  'hidden', '🌑', '{"type":"level_reached","level":76}'),
('true_awakening',    '???',                'Ты видишь то, что другие не замечают',               'hidden', '👁️',  '{"type":"streak_days","count":50}')

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- FUNCTION: Insert default rewards for new users
-- Called from onboarding Server Action
-- ============================================================

CREATE OR REPLACE FUNCTION insert_default_rewards(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO rewards (user_id, title, emoji, cost, sort_order) VALUES
    (p_user_id, 'Заказать еду',        '🍕', 100,  1),
    (p_user_id, 'Час развлечений',     '🎮', 200,  2),
    (p_user_id, 'Покупка для хобби',   '🎁', 300,  3),
    (p_user_id, 'День полного отдыха', '😴', 500,  4),
    (p_user_id, 'Крупная покупка',     '🛍️', 1000, 5);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
