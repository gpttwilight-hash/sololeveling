import type { AttributeKey } from "./dispatch-templates";

export interface PortalStep {
  title: string;
  description: string;
  xp: number;
}

export interface PortalTemplate {
  id: string;
  title: string;
  description: string;
  attribute: AttributeKey;
  steps: [PortalStep, PortalStep, PortalStep];
  badgeName: string;
}

export const PORTAL_TEMPLATES: PortalTemplate[] = [
  // STR
  {
    id: "p-str-1", title: "Врата Силы", description: "Система открывает испытание физической выносливости.", attribute: "str",
    steps: [
      { title: "Разминка", description: "Сделай 10 минут лёгкой физической активности", xp: 20 },
      { title: "Основная нагрузка", description: "Тренировка или прогулка 20+ минут", xp: 35 },
      { title: "Финальный рывок", description: "Максимальное усилие: 5 минут интенсивного движения", xp: 50 },
    ],
    badgeName: "Врата Силы пройдены",
  },
  {
    id: "p-str-2", title: "Испытание Тела", description: "Тело — инструмент охотника. Сегодня оно проходит проверку.", attribute: "str",
    steps: [
      { title: "Утренняя зарядка", description: "10 минут зарядки или растяжки", xp: 20 },
      { title: "Прогулка", description: "Пройди минимум 3000 шагов", xp: 30 },
      { title: "Силовое упражнение", description: "30 отжиманий, приседаний или аналог", xp: 55 },
    ],
    badgeName: "Воин тела",
  },
  {
    id: "p-str-3", title: "Рассвет Охотника", description: "Настоящий охотник начинает день с движения.", attribute: "str",
    steps: [
      { title: "Встань вовремя", description: "Встань по плану без повтора будильника", xp: 25 },
      { title: "Стакан воды + движение", description: "Гидратация и 5 минут физической активности", xp: 25 },
      { title: "Выйди на улицу", description: "15+ минут на свежем воздухе", xp: 55 },
    ],
    badgeName: "Рассвет пройден",
  },
  // INT
  {
    id: "p-int-1", title: "Врата Знания", description: "Система открывает испытание интеллекта.", attribute: "int",
    steps: [
      { title: "Чтение", description: "Прочитай 10+ страниц книги или статью", xp: 20 },
      { title: "Анализ", description: "Запиши 3 ключевые идеи из прочитанного", xp: 35 },
      { title: "Применение", description: "Как применить эти идеи в своей жизни? Запиши.", xp: 50 },
    ],
    badgeName: "Врата Знания пройдены",
  },
  {
    id: "p-int-2", title: "Испытание Разума", description: "Разум охотника — его главное оружие.", attribute: "int",
    steps: [
      { title: "Обзор целей", description: "Просмотри свои цели на этот месяц", xp: 20 },
      { title: "Планирование", description: "Составь план действий на ближайшие 3 дня", xp: 35 },
      { title: "Приоритизация", description: "Определи ONE thing — самое важное прямо сейчас", xp: 50 },
    ],
    badgeName: "Мастер планирования",
  },
  {
    id: "p-int-3", title: "Глубокое погружение", description: "Система требует сосредоточенного изучения.", attribute: "int",
    steps: [
      { title: "Выбери тему", description: "Определи навык или тему для изучения", xp: 15 },
      { title: "Погружение", description: "25 минут изучения без отвлечений", xp: 40 },
      { title: "Фиксация", description: "Запиши всё, что узнал — своими словами", xp: 50 },
    ],
    badgeName: "Исследователь разума",
  },
  // CHA
  {
    id: "p-cha-1", title: "Врата Харизмы", description: "Система активирует испытание на влияние и связи.", attribute: "cha",
    steps: [
      { title: "Благодарность", description: "Напиши сообщение с благодарностью кому-то", xp: 20 },
      { title: "Инициатива", description: "Начни разговор с кем-то новым или давно не говорил", xp: 35 },
      { title: "Вклад", description: "Помоги кому-то — советом, временем или делом", xp: 50 },
    ],
    badgeName: "Мастер связей",
  },
  {
    id: "p-cha-2", title: "Голос Охотника", description: "Охотник, который умеет говорить — покоряет мир.", attribute: "cha",
    steps: [
      { title: "Активное слушание", description: "В разговоре сегодня: слушай больше, чем говори", xp: 20 },
      { title: "Комплимент", description: "Сделай искренний комплимент трём людям", xp: 30 },
      { title: "Публичность", description: "Поделись мыслью в соцсетях, с коллегами или близкими", xp: 55 },
    ],
    badgeName: "Голос в толпе",
  },
  // DIS
  {
    id: "p-dis-1", title: "Врата Дисциплины", description: "Система открывает испытание воли и концентрации.", attribute: "dis",
    steps: [
      { title: "Без телефона", description: "Первый час после пробуждения — без соцсетей", xp: 25 },
      { title: "Фокус-блок", description: "25 минут работы в полной тишине (режим Помодоро)", xp: 35 },
      { title: "Завершение", description: "Закрой одно дело, которое откладывал", xp: 45 },
    ],
    badgeName: "Железная воля",
  },
  {
    id: "p-dis-2", title: "Режим Охотника", description: "Распорядок дня — это основа роста.", attribute: "dis",
    steps: [
      { title: "Ранний старт", description: "Начни главную задачу дня до 10:00", xp: 25 },
      { title: "Без прокрастинации", description: "Сделай самое нежелательное дело сразу", xp: 35 },
      { title: "Вечерний ритуал", description: "Запланируй завтра до конца сегодняшнего дня", xp: 45 },
    ],
    badgeName: "Режим активирован",
  },
  // WLT
  {
    id: "p-wlt-1", title: "Врата Богатства", description: "Система открывает испытание финансового мышления.", attribute: "wlt",
    steps: [
      { title: "Финансовый обзор", description: "Посмотри на свои расходы за последние 7 дней", xp: 20 },
      { title: "Возможности", description: "Запиши 3 способа увеличить доход или сократить расходы", xp: 35 },
      { title: "Действие", description: "Сделай один шаг к финансовой цели прямо сейчас", xp: 50 },
    ],
    badgeName: "Финансовый охотник",
  },
  {
    id: "p-wlt-2", title: "Инвестиция в Себя", description: "Лучшая инвестиция — в свои навыки и здоровье.", attribute: "wlt",
    steps: [
      { title: "Аудит навыков", description: "Какой навык сделает тебя дороже через год?", xp: 20 },
      { title: "Обучение", description: "Потрать 30 минут на изучение этого навыка", xp: 40 },
      { title: "Нетворкинг", description: "Свяжись с кем-то в твоей сфере", xp: 45 },
    ],
    badgeName: "Инвестор в себя",
  },
  // Универсальные
  {
    id: "p-all-1", title: "Испытание Баланса", description: "Сильный охотник развивает все атрибуты.", attribute: "dis",
    steps: [
      { title: "Тело", description: "10 минут физической активности", xp: 20 },
      { title: "Разум", description: "10 минут чтения или изучения", xp: 20 },
      { title: "Связи", description: "Напиши кому-нибудь что-то доброе", xp: 65 },
    ],
    badgeName: "Сбалансированный охотник",
  },
  {
    id: "p-all-2", title: "Портал Рефлексии", description: "Охотник, который анализирует путь — движется быстрее.", attribute: "int",
    steps: [
      { title: "Вчерашний день", description: "Что прошло хорошо вчера?", xp: 15 },
      { title: "Сегодняшний фокус", description: "Что самое важное сделать сегодня?", xp: 25 },
      { title: "Долгосрочная цель", description: "На каком шаге ты сейчас?", xp: 65 },
    ],
    badgeName: "Мастер рефлексии",
  },
];

export function getPortalForDate(date: Date): PortalTemplate {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return PORTAL_TEMPLATES[dayOfYear % PORTAL_TEMPLATES.length];
}
