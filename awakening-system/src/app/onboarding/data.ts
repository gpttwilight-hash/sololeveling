export const STARTER_QUESTS = {
  str: [
    { title: "Тренировка 30+ минут", difficulty: "medium", xp_reward: 15, coin_reward: 8 },
    { title: "Прогулка на свежем воздухе", difficulty: "easy", xp_reward: 8, coin_reward: 4 },
    { title: "Отжимания 3 подхода", difficulty: "easy", xp_reward: 8, coin_reward: 4 },
    { title: "Растяжка / йога 20 мин", difficulty: "easy", xp_reward: 8, coin_reward: 4 },
  ],
  int: [
    { title: "Чтение 30 минут", difficulty: "easy", xp_reward: 10, coin_reward: 5 },
    { title: "Изучение нового навыка 45 мин", difficulty: "medium", xp_reward: 15, coin_reward: 8 },
    { title: "Конспектирование / заметки", difficulty: "easy", xp_reward: 8, coin_reward: 4 },
    { title: "Курс или урок онлайн", difficulty: "medium", xp_reward: 12, coin_reward: 6 },
  ],
  cha: [
    { title: "Работа над контентом / проектом", difficulty: "medium", xp_reward: 20, coin_reward: 10 },
    { title: "Социальное взаимодействие", difficulty: "easy", xp_reward: 8, coin_reward: 4 },
    { title: "Публичное выступление / звонок", difficulty: "hard", xp_reward: 30, coin_reward: 15 },
    { title: "Написать пост / статью", difficulty: "medium", xp_reward: 15, coin_reward: 8 },
  ],
  dis: [
    { title: "Подъём до 7:00", difficulty: "medium", xp_reward: 10, coin_reward: 5 },
    { title: "Без вредных привычек весь день", difficulty: "medium", xp_reward: 5, coin_reward: 3 },
    { title: "Медитация 10 минут", difficulty: "easy", xp_reward: 8, coin_reward: 4 },
    { title: "Цифровой детокс 2 часа", difficulty: "medium", xp_reward: 10, coin_reward: 5 },
  ],
  wlt: [
    { title: "Работа над основным проектом 2ч", difficulty: "medium", xp_reward: 20, coin_reward: 10 },
    { title: "Учёт финансов / бюджет", difficulty: "easy", xp_reward: 8, coin_reward: 4 },
    { title: "Нетворкинг / деловой контакт", difficulty: "medium", xp_reward: 15, coin_reward: 8 },
    { title: "Инвестировать время в карьеру", difficulty: "medium", xp_reward: 15, coin_reward: 8 },
  ],
} as const;

export type FocusKey = keyof typeof STARTER_QUESTS;
