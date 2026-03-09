export interface BossTemplate {
  title: string;
  description: string;
  badge_name: string;
  total_quests: number;
  bonus_xp: number;
}

export const WEEKLY_BOSSES: BossTemplate[] = [
  { title: "Страж Рутины", description: "Победи инерцию — выполни 5 ключевых задач на неделе", badge_name: "Победитель Рутины", total_quests: 5, bonus_xp: 500 },
  { title: "Демон Прокрастинации", description: "Закрой 3 давно откладываемых дела и 2 новых квеста", badge_name: "Убийца Прокрастинации", total_quests: 5, bonus_xp: 500 },
  { title: "Тень Лени", description: "Поддерживай активность каждый день — выполни 7 квестов", badge_name: "Воин Активности", total_quests: 7, bonus_xp: 600 },
  { title: "Архидемон Хаоса", description: "Наведи порядок в жизни — 5 квестов по дисциплине", badge_name: "Мастер Порядка", total_quests: 5, bonus_xp: 550 },
  { title: "Страж Прошлого", description: "Сломай старые паттерны — 6 квестов на развитие новых навыков", badge_name: "Разрушитель Шаблонов", total_quests: 6, bonus_xp: 600 },
  { title: "Монарх Сомнений", description: "Действуй несмотря на неуверенность — выполни 5 сложных квестов", badge_name: "Преодолевший Сомнения", total_quests: 5, bonus_xp: 550 },
  { title: "Дракон Усталости", description: "Сохраняй темп несмотря на усталость — 4 квеста за неделю", badge_name: "Стойкий Охотник", total_quests: 4, bonus_xp: 450 },
  { title: "Повелитель Отвлечений", description: "Оставайся в фокусе — 6 квестов без пропусков", badge_name: "Мастер Фокуса", total_quests: 6, bonus_xp: 580 },
  { title: "Тёмный Рыцарь Комфорта", description: "Выйди из зоны комфорта — 5 квестов в новых областях", badge_name: "Первопроходец", total_quests: 5, bonus_xp: 520 },
  { title: "Высший Демон Самосаботажа", description: "Финальный босс: 7 квестов без единого пропуска", badge_name: "Легенда Пробуждения", total_quests: 7, bonus_xp: 750 },
];

export function getBossForWeek(weekNumber: number): BossTemplate {
  return WEEKLY_BOSSES[weekNumber % WEEKLY_BOSSES.length];
}

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function getMondayOfCurrentWeek(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split("T")[0];
}
