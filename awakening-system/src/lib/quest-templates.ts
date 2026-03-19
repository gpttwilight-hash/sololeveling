// Shared quest template library — used in onboarding and quest-form

export const QUEST_TEMPLATES = {
    str: [
        { title: "Тренировка 30+ минут", difficulty: "medium", xp_reward: 15, coin_reward: 8 },
        { title: "Прогулка на свежем воздухе", difficulty: "easy", xp_reward: 8, coin_reward: 4 },
        { title: "Отжимания 3 подхода", difficulty: "easy", xp_reward: 8, coin_reward: 4 },
        { title: "Растяжка / йога 20 мин", difficulty: "easy", xp_reward: 8, coin_reward: 4 },
        { title: "Бег 30 мин", difficulty: "medium", xp_reward: 15, coin_reward: 8 },
        { title: "Холодный душ", difficulty: "medium", xp_reward: 10, coin_reward: 5 },
    ],
    int: [
        { title: "Чтение 30 минут", difficulty: "easy", xp_reward: 10, coin_reward: 5 },
        { title: "Изучение нового навыка 45 мин", difficulty: "medium", xp_reward: 15, coin_reward: 8 },
        { title: "Конспектирование / заметки", difficulty: "easy", xp_reward: 8, coin_reward: 4 },
        { title: "Курс или урок онлайн", difficulty: "medium", xp_reward: 12, coin_reward: 6 },
        { title: "Решить задачу / головоломку", difficulty: "easy", xp_reward: 8, coin_reward: 4 },
        { title: "Изучение языка 20 минут", difficulty: "easy", xp_reward: 8, coin_reward: 4 },
    ],
    cha: [
        { title: "Работа над контентом / проектом", difficulty: "medium", xp_reward: 20, coin_reward: 10 },
        { title: "Социальное взаимодействие", difficulty: "easy", xp_reward: 8, coin_reward: 4 },
        { title: "Публичное выступление / звонок", difficulty: "hard", xp_reward: 30, coin_reward: 15 },
        { title: "Написать пост / статью", difficulty: "medium", xp_reward: 15, coin_reward: 8 },
        { title: "Записать видео / подкаст", difficulty: "hard", xp_reward: 25, coin_reward: 12 },
        { title: "Поблагодарить 3 людей", difficulty: "easy", xp_reward: 5, coin_reward: 3 },
    ],
    dis: [
        { title: "Подъём до 7:00", difficulty: "medium", xp_reward: 10, coin_reward: 5 },
        { title: "Без вредных привычек весь день", difficulty: "medium", xp_reward: 5, coin_reward: 3 },
        { title: "Медитация 10 минут", difficulty: "easy", xp_reward: 8, coin_reward: 4 },
        { title: "Цифровой детокс 2 часа", difficulty: "medium", xp_reward: 10, coin_reward: 5 },
        { title: "Планирование следующего дня", difficulty: "easy", xp_reward: 5, coin_reward: 3 },
        { title: "Не откладывать задачи", difficulty: "hard", xp_reward: 15, coin_reward: 8 },
    ],
    wlt: [
        { title: "Работа над основным проектом 2ч", difficulty: "medium", xp_reward: 20, coin_reward: 10 },
        { title: "Учёт финансов / бюджет", difficulty: "easy", xp_reward: 8, coin_reward: 4 },
        { title: "Нетворкинг / деловой контакт", difficulty: "medium", xp_reward: 15, coin_reward: 8 },
        { title: "Инвестировать время в карьеру", difficulty: "medium", xp_reward: 15, coin_reward: 8 },
        { title: "Прочесть о финансах 20 мин", difficulty: "easy", xp_reward: 8, coin_reward: 4 },
        { title: "Сделать деловое письмо / предложение", difficulty: "hard", xp_reward: 25, coin_reward: 12 },
    ],
} as const;

export type TemplateAttributeKey = keyof typeof QUEST_TEMPLATES;

export const TEMPLATE_ATTRIBUTE_LABELS: Record<TemplateAttributeKey, { label: string; color: string }> = {
    str: { label: "STR — Сила", color: "var(--color-strength)" },
    int: { label: "INT — Интеллект", color: "var(--color-intellect)" },
    cha: { label: "CHA — Харизма", color: "var(--color-charisma)" },
    dis: { label: "DIS — Дисциплина", color: "var(--color-discipline)" },
    wlt: { label: "WLT — Богатство", color: "var(--color-wealth)" },
};

// For backward compatibility with onboarding/data.ts
export const STARTER_QUESTS = QUEST_TEMPLATES;
export type FocusKey = TemplateAttributeKey;
