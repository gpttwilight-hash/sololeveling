export interface MilestoneTemplate {
  streakDay: number;
  title: string;
  description: string;
  titleGranted: string;
}

export const MILESTONE_TEMPLATES: MilestoneTemplate[] = [
  { streakDay: 7,   title: "НЕДЕЛЯ ПРОЙДЕНА",   description: "Семь дней непрерывного роста. Система фиксирует: ты не сдался там, где сдаются 80%.",                                          titleGranted: "Пробуждённый"        },
  { streakDay: 14,  title: "ДВЕ НЕДЕЛИ",         description: "Четырнадцать дней. Привычка формируется. Охотник доказал системе свою серьёзность.",                                            titleGranted: "Закалённый"          },
  { streakDay: 21,  title: "21 ДЕНЬ",             description: "Три недели. Наука говорит — привычка сформирована. Система согласна: ты изменился.",                                            titleGranted: "Стойкий"             },
  { streakDay: 30,  title: "30 ДНЕЙ",             description: "Месяц. Ты больше не тот, кто начинал. Система присваивает статус: Несломленный.",                                              titleGranted: "Несломленный"        },
  { streakDay: 50,  title: "50 ДНЕЙ",             description: "Пятьдесят дней. В мире, где большинство бросает на первой неделе — ты феномен.",                                               titleGranted: "Феномен"             },
  { streakDay: 66,  title: "66 ДНЕЙ",             description: "66 дней — научно доказанная точка автоматизации привычки. Это теперь часть тебя.",                                             titleGranted: "Автоматизированный"  },
  { streakDay: 100, title: "100 ДНЕЙ",            description: "Сто дней. Система регистрирует: это не эксперимент. Это образ жизни. Это ты.",                                                 titleGranted: "Легенда Системы"     },
  { streakDay: 180, title: "180 ДНЕЙ",            description: "Полгода. Охотник, который прошёл 180 дней, не нуждается в мотивации — у него есть система.",                                  titleGranted: "Хранитель пути"      },
  { streakDay: 365, title: "365 ДНЕЙ",            description: "Год. Целый год ежедневного роста. Система не знает слов для этого. Только одно: Монарх.",                                      titleGranted: "Вечный Монарх"       },
  { streakDay: 500, title: "500 ДНЕЙ",            description: "Пятьсот дней. Система создавалась не для таких как ты. Ты создал себя сам.",                                                   titleGranted: "Создатель Систем"    },
];

export const MILESTONE_DAYS = MILESTONE_TEMPLATES.map((m) => m.streakDay);

export function getMilestoneForStreak(streak: number): MilestoneTemplate | null {
  return MILESTONE_TEMPLATES.find((m) => m.streakDay === streak) ?? null;
}

export function shouldShowMilestone(
  currentStreak: number,
  lastMilestoneShown: number
): MilestoneTemplate | null {
  const applicable = MILESTONE_TEMPLATES
    .filter((m) => m.streakDay <= currentStreak && m.streakDay > lastMilestoneShown)
    .sort((a, b) => b.streakDay - a.streakDay);
  return applicable[0] ?? null;
}
